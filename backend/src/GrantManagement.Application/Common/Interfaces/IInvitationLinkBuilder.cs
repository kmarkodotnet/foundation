namespace GrantManagement.Application.Common.Interfaces;

/// <summary>
/// A meghívó e-mailben küldött elfogadási link előállítása
/// (a frontend /auth/accept oldala várja a tokent).
/// </summary>
public interface IInvitationLinkBuilder
{
    string BuildAcceptUrl(string invitationToken);
}
