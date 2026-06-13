namespace GrantManagement.Domain.Exceptions;

public class InvitationAlreadyAcceptedException : Exception
{
    public InvitationAlreadyAcceptedException()
        : base("Ez a meghívó már el lett fogadva.") { }
}
