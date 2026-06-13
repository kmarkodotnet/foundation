namespace GrantManagement.Domain.Exceptions;

public class InvitationExpiredException : Exception
{
    public InvitationExpiredException()
        : base("A meghívó lejárt.") { }
}
