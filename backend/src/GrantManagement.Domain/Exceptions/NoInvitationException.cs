namespace GrantManagement.Domain.Exceptions;

public class NoInvitationException : Exception
{
    public string Email { get; }

    public NoInvitationException(string email)
        : base($"Nincs elfogadott meghívó ehhez az email-hez: {email}")
    {
        Email = email;
    }
}
