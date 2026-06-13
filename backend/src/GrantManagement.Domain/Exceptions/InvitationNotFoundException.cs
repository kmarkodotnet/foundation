namespace GrantManagement.Domain.Exceptions;

public class InvitationNotFoundException : NotFoundException
{
    public InvitationNotFoundException(Guid id)
        : base("Invitation", id) { }

    public InvitationNotFoundException(string token)
        : base("Invitation", token) { }
}
