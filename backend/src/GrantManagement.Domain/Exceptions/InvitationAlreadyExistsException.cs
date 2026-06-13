namespace GrantManagement.Domain.Exceptions;

public class InvitationAlreadyExistsException : DomainException
{
    public InvitationAlreadyExistsException(string email)
        : base($"Erre az email-re már van függőben lévő meghívó: {email}") { }
}
