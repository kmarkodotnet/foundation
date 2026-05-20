using FluentAssertions;
using GrantManagement.Application.BudgetPlan.Commands.UpsertBudgetPlan;
using GrantManagement.Domain.Entities;
using GrantManagement.Domain.Enums;
using GrantManagement.Domain.ValueObjects;
using GrantManagement.Integration.Tests.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace GrantManagement.Integration.Tests.BudgetPlan;

public class UpsertBudgetPlanTests : IntegrationTestBase
{
    [SkippableFact]
    public async Task Handle_WhenApplicationInBudgetPlanStep_ShouldPersistSingleItem()
    {
        SkipIfDockerUnavailable();

        // Arrange
        var userId = Guid.NewGuid();
        var application = await SeedWonApplicationAsync(userId);

        await using var handlerCtx = CreateContext();
        var handler = new UpsertBudgetPlanCommandHandler(
            handlerCtx,
            new FakeCurrentUserService(userId));

        var command = new UpsertBudgetPlanCommand(
            ApplicationId: application.Id,
            Notes: "Teszt költési terv",
            Items:
            [
                new UpsertBudgetItemDto(
                    Id: null,
                    Name: "Rendezvényterem bérlés",
                    Type: BudgetItemType.Event,
                    PlannedAmount: 500_000m,
                    Description: "Budapest, 2026. június",
                    SortOrder: 1)
            ]);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert — visszaadott DTO
        result.ApplicationId.Should().Be(application.Id);
        result.Notes.Should().Be("Teszt költési terv");
        result.TotalPlanned.Should().Be(500_000m);
        result.Items.Should().HaveCount(1);
        result.Items[0].Name.Should().Be("Rendezvényterem bérlés");
        result.Items[0].PlannedAmount.Should().Be(500_000m);
        result.Items[0].Type.Should().Be(BudgetItemType.Event.ToString());

        // Assert — perzisztencia ellenőrzése friss context-tel
        await using var verifyCtx = CreateContext();

        var savedPlan = await verifyCtx.BudgetPlans
            .Include(bp => bp.Items)
            .FirstOrDefaultAsync(bp => bp.ApplicationId == application.Id);

        savedPlan.Should().NotBeNull();
        savedPlan!.Notes.Should().Be("Teszt költési terv");
        savedPlan.CreatedAt.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(5));
        savedPlan.UpdatedAt.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(5));

        var item = savedPlan.Items.Should().ContainSingle().Subject;
        item.Name.Should().Be("Rendezvényterem bérlés");
        item.Type.Should().Be(BudgetItemType.Event);
        item.PlannedAmount.Should().Be(500_000m);
        item.Description.Should().Be("Budapest, 2026. június");
        item.SortOrder.Should().Be(1);
        item.IsDeleted.Should().BeFalse();
        item.BudgetPlanId.Should().Be(savedPlan.Id);
    }

    [SkippableFact]
    public async Task Handle_WhenCalledTwice_ShouldUpdateExistingItemAndPreserveCount()
    {
        SkipIfDockerUnavailable();

        // Arrange
        var userId = Guid.NewGuid();
        var application = await SeedWonApplicationAsync(userId);

        await using var firstCtx = CreateContext();
        var handler = new UpsertBudgetPlanCommandHandler(
            firstCtx,
            new FakeCurrentUserService(userId));

        // Első mentés — tétel létrehozása
        var firstResult = await handler.Handle(new UpsertBudgetPlanCommand(
            application.Id,
            Notes: null,
            Items: [new(null, "Eredeti tétel", BudgetItemType.Asset, 100_000m, null, 1)]),
            CancellationToken.None);

        var createdItemId = firstResult.Items[0].Id;

        // Act — második mentés, meglévő tétel módosítása
        await using var secondCtx = CreateContext();
        var handler2 = new UpsertBudgetPlanCommandHandler(
            secondCtx,
            new FakeCurrentUserService(userId));

        await handler2.Handle(new UpsertBudgetPlanCommand(
            application.Id,
            Notes: "Frissített",
            Items: [new(createdItemId, "Módosított tétel", BudgetItemType.Asset, 200_000m, null, 1)]),
            CancellationToken.None);

        // Assert — csak a módosított tétel létezik, nincs duplikáció
        await using var verifyCtx = CreateContext();
        var savedPlan = await verifyCtx.BudgetPlans
            .Include(bp => bp.Items)
            .FirstAsync(bp => bp.ApplicationId == application.Id);

        savedPlan.Notes.Should().Be("Frissített");
        savedPlan.Items.Should().ContainSingle();
        savedPlan.Items[0].Id.Should().Be(createdItemId);
        savedPlan.Items[0].Name.Should().Be("Módosított tétel");
        savedPlan.Items[0].PlannedAmount.Should().Be(200_000m);
    }

    // ── seed helper ──────────────────────────────────────────────────────────

    private async Task<Domain.Entities.Application> SeedWonApplicationAsync(Guid userId)
    {
        var granter = Granter.Create(
            $"Teszt Pályáztató {Guid.NewGuid():N}",
            description: null,
            ContactInfo.Empty);

        DbContext.Granters.Add(granter);

        var application = Domain.Entities.Application.Create(
            title: "Integrációs teszt pályázat",
            granterId: granter.Id,
            callData: new CallStepData
            {
                SubmissionDeadline = DateTimeOffset.UtcNow.AddDays(90)
            },
            createdByUserId: userId);

        // Won állapot + BudgetPlan lépés = Active
        application.RecordSubmission(
            new SubmissionStepData { SubmittedAt = DateTimeOffset.UtcNow, SubmittedByUserId = userId },
            userId);

        application.ApproveSubmission(userId);

        application.RecordResult(
            ApplicationResult.Won(
                DateOnly.FromDateTime(DateTime.Today),
                new Money(1_000_000m, "HUF")),
            userId);

        DbContext.Applications.Add(application);
        await DbContext.SaveChangesAsync();

        return application;
    }
}
