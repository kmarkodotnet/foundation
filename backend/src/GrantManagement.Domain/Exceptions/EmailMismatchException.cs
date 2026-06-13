namespace GrantManagement.Domain.Exceptions;

public class EmailMismatchException : Exception
{
    public EmailMismatchException(string invitedEmail, string actualEmail)
        : base($"A meghívó email-je ({invitedEmail}) nem egyezik a bejelentkező Google-fiók email-jével ({actualEmail}).") { }
}
