using GrantManagement.Domain.Common;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.Events;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;

namespace GrantManagement.Domain.Entities;

public class Application : AggregateRoot<Guid>
{
    public string Title { get; private set; } = null!;
    public string? Identifier { get; private set; }
    public string? Description { get; private set; }
    public ApplicationStatus Status { get; private set; }
    public Guid GranterId { get; private set; }
    public Guid CreatedByUserId { get; private set; }
    public bool IsArchived { get; private set; }

    public CallStepData? CallData { get; private set; }
    public SubmissionStepData? SubmissionData { get; private set; }
    public ApplicationResult? Result { get; private set; }
    public GranterContractData? GranterContractData { get; private set; }

    private readonly List<WorkflowStep> _workflowSteps = [];
    private readonly List<VendorContract> _vendorContracts = [];
    private readonly List<Invoice> _invoices = [];
    private readonly List<ProofRecord> _proofRecords = [];

    public IReadOnlyList<WorkflowStep> WorkflowSteps => _workflowSteps.AsReadOnly();
    public IReadOnlyList<VendorContract> VendorContracts => _vendorContracts.AsReadOnly();
    public IReadOnlyList<Invoice> Invoices => _invoices.AsReadOnly();
    public IReadOnlyList<ProofRecord> ProofRecords => _proofRecords.AsReadOnly();

    public BudgetPlan? BudgetPlan { get; private set; }
    public Settlement? Settlement { get; private set; }

    private static readonly WorkflowStepType[] LaterStepTypes =
    [
        WorkflowStepType.Contract, WorkflowStepType.BudgetPlan, WorkflowStepType.VendorContracts,
        WorkflowStepType.Invoices, WorkflowStepType.Proof, WorkflowStepType.Settlement,
    ];

    public bool IsLocked => Status is ApplicationStatus.ClosedWon
        or ApplicationStatus.ClosedLost
        or ApplicationStatus.Archived;

    public decimal TotalInvoicedAmount => _invoices
        .Where(i => !i.IsDeleted)
        .Sum(i => i.Amount);

    public decimal TotalPaidAmount => _invoices
        .Where(i => i.IsPaid && !i.IsDeleted)
        .Sum(i => i.Amount);

    public WorkflowStep? CurrentActiveStep =>
        _workflowSteps.FirstOrDefault(s => s.Status == WorkflowStepStatus.Active);

    private Application() { }

    public static Application Create(
        string title,
        Guid granterId,
        CallStepData callData,
        Guid createdByUserId,
        string? identifier = null,
        string? description = null)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new DomainException("A pályázat neve kötelező.");

        var app = new Application
        {
            Id = Guid.NewGuid(),
            Title = title.Trim(),
            Identifier = identifier?.Trim(),
            Description = description?.Trim(),
            Status = ApplicationStatus.Draft,
            GranterId = granterId,
            CreatedByUserId = createdByUserId,
            CallData = callData,
            IsArchived = false,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        app.InitializeWorkflowSteps();
        app.CompleteCallStep(createdByUserId);

        app.RaiseDomainEvent(new ApplicationCreated(
            app.Id,
            app.Title,
            app.GranterId,
            callData.SubmissionDeadline,
            createdByUserId));

        return app;
    }

    private void CompleteCallStep(Guid byUserId)
    {
        var callStep = _workflowSteps.First(s => s.StepType == WorkflowStepType.Call);
        callStep.Complete(byUserId);

        var submissionStep = _workflowSteps.First(s => s.StepType == WorkflowStepType.Submission);
        submissionStep.Activate();
    }

    private void InitializeWorkflowSteps()
    {
        var stepTypes = new[]
        {
            (WorkflowStepType.Call, 1, false),
            (WorkflowStepType.Submission, 2, false),
            (WorkflowStepType.Result, 3, false),
            (WorkflowStepType.Contract, 4, true),
            (WorkflowStepType.BudgetPlan, 5, true),
            (WorkflowStepType.VendorContracts, 6, true),
            (WorkflowStepType.Invoices, 7, true),
            (WorkflowStepType.Proof, 8, true),
            (WorkflowStepType.Settlement, 9, false)
        };

        foreach (var (type, order, isSkippable) in stepTypes)
        {
            _workflowSteps.Add(WorkflowStep.Create(Id, type, order, isSkippable));
        }
    }

    public void UpdateBasicInfo(string title, string? identifier, string? description)
    {
        EnsureNotLocked();
        if (string.IsNullOrWhiteSpace(title))
            throw new DomainException("A pályázat neve kötelező.");
        Title = title.Trim();
        Identifier = identifier?.Trim();
        Description = description?.Trim();
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void UpdateCallData(CallStepData data)
    {
        EnsureNotLocked();
        CallData = data;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void RecordSubmission(SubmissionStepData data, Guid byUserId)
    {
        EnsureNotLocked();
        SubmissionData = data;
        Status = ApplicationStatus.InProgress;
        UpdatedAt = DateTimeOffset.UtcNow;

        RaiseDomainEvent(new ApplicationSubmitted(Id, data.SubmittedAt, byUserId));
    }

    public void ApproveSubmission(Guid approverUserId)
    {
        EnsureNotLocked();
        var step = GetStep(WorkflowStepType.Submission);
        step.Approve(approverUserId);
        step.Complete(approverUserId);
        Status = ApplicationStatus.Submitted;
        GetStep(WorkflowStepType.Result).Activate();
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void RecordResult(ApplicationResult result, Guid byUserId)
    {
        EnsureNotLocked();

        var resultStep = GetStep(WorkflowStepType.Result);
        if (resultStep.Status != WorkflowStepStatus.Active)
            throw new DomainException("Az eredmény lépés nem rögzíthető ebben az állapotban.");

        Result = result;
        resultStep.Complete(byUserId);

        if (result.Outcome == ValueObjects.ApplicationOutcome.Won)
        {
            Status = ApplicationStatus.Won;
            foreach (var type in LaterStepTypes)
                GetStep(type).Activate();
            RaiseDomainEvent(new ApplicationWon(Id, result.AwardedAmount!, result.ResultDate, byUserId));
        }
        else
        {
            Status = ApplicationStatus.Lost;
            foreach (var type in LaterStepTypes)
                GetStep(type).NotApply();
            RaiseDomainEvent(new ApplicationLost(Id, result.ResultDate, byUserId));
        }

        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void CorrectResult(ApplicationResult result, Guid byUserId)
    {
        if (Status is ApplicationStatus.ClosedWon or ApplicationStatus.ClosedLost or ApplicationStatus.Archived)
            throw new DomainException("Lezárt vagy archivált pályázat eredménye nem módosítható.");

        Result = result;

        var resultStep = GetStep(WorkflowStepType.Result);
        resultStep.Reactivate();
        resultStep.Complete(byUserId);

        if (result.Outcome == ValueObjects.ApplicationOutcome.Won)
        {
            Status = ApplicationStatus.Won;
            foreach (var type in LaterStepTypes)
                GetStep(type).Activate();
            RaiseDomainEvent(new ApplicationWon(Id, result.AwardedAmount!, result.ResultDate, byUserId));
        }
        else
        {
            Status = ApplicationStatus.Lost;
            foreach (var type in LaterStepTypes)
                GetStep(type).NotApply();
            RaiseDomainEvent(new ApplicationLost(Id, result.ResultDate, byUserId));
        }

        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SkipStep(WorkflowStepType stepType, string? reason, Guid byUserId)
    {
        EnsureNotLocked();
        var step = GetStep(stepType);
        if (!step.IsSkippable)
            throw new DomainException($"A(z) {stepType} lépés nem hagyható ki.");
        step.Skip(reason, byUserId);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void ReactivateStep(WorkflowStepType stepType)
    {
        EnsureNotLocked();
        var step = GetStep(stepType);
        step.Reactivate();
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void RecordGranterContract(GranterContractData data)
    {
        EnsureNotLocked();
        GranterContractData = data;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void CompleteStep(WorkflowStepType stepType, Guid byUserId)
    {
        EnsureNotLocked();
        var step = GetStep(stepType);
        if (step.Status != WorkflowStepStatus.Active)
            throw new DomainException($"A(z) {stepType} lépés nem zárható le ebben az állapotban.");
        step.Complete(byUserId);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public BudgetPlan CreateBudgetPlan()
    {
        EnsureNotLocked();
        if (Status < ApplicationStatus.Won)
            throw new DomainException("Költési terv csak nyert pályázathoz hozható létre.");
        if (BudgetPlan != null)
            throw new DomainException("Már létezik költési terv ehhez a pályázathoz.");

        BudgetPlan = BudgetPlan.Create(Id);
        return BudgetPlan;
    }

    public void ApproveBudgetPlan(Guid approverUserId)
    {
        EnsureNotLocked();
        if (BudgetPlan == null)
            throw new DomainException("Nincs jóváhagyható költési terv.");
        BudgetPlan.Approve(approverUserId);
        GetStep(WorkflowStepType.BudgetPlan).Approve(approverUserId);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public VendorContract AddVendorContract(
        Guid vendorId,
        Money amount,
        Guid byUserId,
        string? contractIdentifier = null,
        DateOnly? contractDate = null,
        Guid? budgetItemId = null,
        string? notes = null)
    {
        EnsureNotLocked();
        var contract = VendorContract.Create(
            Id, vendorId, amount, byUserId,
            contractIdentifier, contractDate, budgetItemId, notes);
        _vendorContracts.Add(contract);
        UpdatedAt = DateTimeOffset.UtcNow;
        return contract;
    }

    public void UpdateVendorContract(
        Guid contractId,
        Guid vendorId,
        Money amount,
        string? contractIdentifier,
        DateOnly? contractDate,
        Guid? budgetItemId,
        string? notes)
    {
        EnsureNotLocked();
        var contract = _vendorContracts.FirstOrDefault(c => c.Id == contractId)
            ?? throw new NotFoundException(nameof(VendorContract), contractId);
        contract.Update(vendorId, amount, contractIdentifier, contractDate, budgetItemId, notes);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void RemoveVendorContract(Guid contractId)
    {
        EnsureNotLocked();
        var contract = _vendorContracts.FirstOrDefault(c => c.Id == contractId)
            ?? throw new NotFoundException(nameof(VendorContract), contractId);

        if (_invoices.Any(i => i.VendorContractId == contractId))
            throw new DomainException("Nem törölhető szerződés, amelyhez számla tartozik.");

        _vendorContracts.Remove(contract);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public Invoice AddInvoice(
        string supplierName,
        string invoiceNumber,
        DateOnly issueDate,
        decimal amount,
        bool isPaid,
        DateOnly? paymentDate,
        Guid byUserId,
        Guid? vendorContractId = null,
        Guid? budgetItemId = null,
        string? notes = null)
    {
        EnsureNotLocked();
        var invoice = Invoice.Create(
            Id, supplierName, invoiceNumber, issueDate, amount,
            isPaid, paymentDate, byUserId, vendorContractId, budgetItemId, notes);
        _invoices.Add(invoice);
        UpdatedAt = DateTimeOffset.UtcNow;
        return invoice;
    }

    public void UpdateInvoice(
        Guid invoiceId,
        string supplierName,
        string invoiceNumber,
        DateOnly issueDate,
        decimal amount,
        bool isPaid,
        DateOnly? paymentDate,
        Guid? vendorContractId,
        Guid? budgetItemId,
        string? notes)
    {
        EnsureNotLocked();
        var invoice = _invoices.FirstOrDefault(i => i.Id == invoiceId)
            ?? throw new NotFoundException(nameof(Invoice), invoiceId);
        invoice.Update(supplierName, invoiceNumber, issueDate, amount, isPaid, paymentDate,
            vendorContractId, budgetItemId, notes);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void MarkInvoicePaid(Guid invoiceId, DateOnly paymentDate)
    {
        EnsureNotLocked();
        var invoice = _invoices.FirstOrDefault(i => i.Id == invoiceId)
            ?? throw new NotFoundException(nameof(Invoice), invoiceId);
        if (invoice.IsPaid)
            throw new DomainException("A számla már fizetve van.");
        invoice.MarkPaid(paymentDate);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SoftDeleteInvoice(Guid invoiceId)
    {
        EnsureNotLocked();
        var invoice = _invoices.FirstOrDefault(i => i.Id == invoiceId)
            ?? throw new NotFoundException(nameof(Invoice), invoiceId);
        invoice.SoftDelete();
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void RemoveInvoice(Guid invoiceId)
    {
        EnsureNotLocked();
        var invoice = _invoices.FirstOrDefault(i => i.Id == invoiceId)
            ?? throw new NotFoundException(nameof(Invoice), invoiceId);
        _invoices.Remove(invoice);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public ProofRecord AddProofRecord(
        string proofType,
        DateOnly eventDate,
        Guid byUserId,
        string? description = null)
    {
        EnsureNotLocked();
        var proof = ProofRecord.Create(Id, proofType, eventDate, byUserId, description);
        _proofRecords.Add(proof);
        UpdatedAt = DateTimeOffset.UtcNow;
        return proof;
    }

    public void RemoveProofRecord(Guid proofId)
    {
        EnsureNotLocked();
        var proof = _proofRecords.FirstOrDefault(p => p.Id == proofId)
            ?? throw new NotFoundException(nameof(ProofRecord), proofId);
        _proofRecords.Remove(proof);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void RecordSettlement(SettlementParams p, Guid byUserId)
    {
        EnsureNotLocked();
        Settlement = Settlement.Create(Id, p, byUserId);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void ApproveSettlement(Guid approverUserId)
    {
        EnsureNotLocked();
        if (Settlement == null)
            throw new DomainException("Nincs jóváhagyható elszámolás.");
        if (Settlement.SettlementDate == default)
            throw new DomainException("Az elszámolás időpontja kitöltése kötelező.");

        Settlement.Approve(approverUserId);
        Status = ApplicationStatus.ClosedWon;
        LockAllSteps();
        UpdatedAt = DateTimeOffset.UtcNow;

        RaiseDomainEvent(new SettlementApproved(Id, approverUserId, DateTimeOffset.UtcNow));
    }

    public Document AttachDocument(
        WorkflowStepType stepType,
        DocumentType documentType,
        string fileName,
        string storagePath,
        long fileSizeBytes,
        string contentType,
        Guid uploadedByUserId,
        string? displayName = null)
    {
        EnsureNotLocked();
        var step = GetStep(stepType);
        var doc = Document.Create(
            step.Id, documentType, fileName, storagePath,
            fileSizeBytes, contentType, uploadedByUserId,
            displayName: displayName);
        step.AddDocument(doc);
        UpdatedAt = DateTimeOffset.UtcNow;

        RaiseDomainEvent(new DocumentAttached(Id, stepType, doc.Id, fileName, uploadedByUserId));
        return doc;
    }

    public void ArchiveDocument(Guid documentId)
    {
        EnsureNotLocked();
        var doc = _workflowSteps
            .SelectMany(s => s.Documents)
            .FirstOrDefault(d => d.Id == documentId)
            ?? throw new NotFoundException(nameof(Document), documentId);
        doc.Archive();
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public Comment AddComment(WorkflowStepType stepType, string text, Guid byUserId)
    {
        EnsureNotLocked();
        var step = GetStep(stepType);
        var comment = Comment.Create(step.Id, text, byUserId);
        step.AddComment(comment);
        UpdatedAt = DateTimeOffset.UtcNow;

        RaiseDomainEvent(new CommentAdded(Id, stepType, comment.Id, byUserId));
        return comment;
    }

    public void EditComment(Guid commentId, string newText)
    {
        EnsureNotLocked();
        var comment = _workflowSteps
            .SelectMany(s => s.Comments)
            .FirstOrDefault(c => c.Id == commentId)
            ?? throw new NotFoundException(nameof(Comment), commentId);
        comment.Edit(newText);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void DeleteComment(Guid commentId)
    {
        EnsureNotLocked();
        var comment = _workflowSteps
            .SelectMany(s => s.Comments)
            .FirstOrDefault(c => c.Id == commentId)
            ?? throw new NotFoundException(nameof(Comment), commentId);
        comment.Delete();
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public EmailAttachment AttachEmail(
        WorkflowStepType stepType,
        string subject,
        string senderEmail,
        DateOnly sentDate,
        EmailDirection direction,
        Guid addedByUserId,
        string? contentSummary = null,
        string? filePath = null)
    {
        EnsureNotLocked();
        var step = GetStep(stepType);
        var email = EmailAttachment.Create(
            step.Id, subject, senderEmail, sentDate, direction,
            addedByUserId, contentSummary, filePath);
        step.AddEmailAttachment(email);
        UpdatedAt = DateTimeOffset.UtcNow;
        return email;
    }

    public void RemoveEmailAttachment(Guid emailId)
    {
        EnsureNotLocked();
        var _ = _workflowSteps
            .SelectMany(s => s.EmailAttachments)
            .FirstOrDefault(e => e.Id == emailId)
            ?? throw new NotFoundException(nameof(EmailAttachment), emailId);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void ManualClose()
    {
        if (Status != ApplicationStatus.Lost)
            throw new DomainException("Csak vesztes pályázat zárható le manuálisan.");
        Status = ApplicationStatus.ClosedLost;
        LockAllSteps();
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Archive()
    {
        if (Status is not (ApplicationStatus.ClosedWon or ApplicationStatus.ClosedLost))
            throw new DomainException("Csak lezárt pályázat archiválható.");
        IsArchived = true;
        Status = ApplicationStatus.Archived;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    private WorkflowStep GetStep(WorkflowStepType stepType)
    {
        return _workflowSteps.FirstOrDefault(s => s.StepType == stepType)
            ?? throw new DomainException($"A(z) {stepType} lépés nem található.");
    }

    private void EnsureNotLocked()
    {
        if (IsLocked)
            throw new DomainException("Lezárt pályázat nem módosítható.");
    }

    private void LockAllSteps()
    {
        foreach (var step in _workflowSteps)
            step.Lock();
    }
}
