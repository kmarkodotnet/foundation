namespace GrantManagement.Domain.Exceptions;

public class InvitationRevokedException : Exception
{
    public InvitationRevokedException()
        : base("A meghívó vissza lett vonva.") { }
}
