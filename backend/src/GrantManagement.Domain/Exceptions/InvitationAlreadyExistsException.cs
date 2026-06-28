namespace GrantManagement.Domain.Exceptions;

public class InvitationAlreadyExistsException : ConflictException
{
    public Guid ExistingInvitationId { get; }

    public InvitationAlreadyExistsException(string email, Guid existingInvitationId)
        : base($"Erre az email-re már van függőben lévő meghívó: {email}")
    {
        ExistingInvitationId = existingInvitationId;
    }
}
