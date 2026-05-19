namespace GrantManagement.Domain.Exceptions;

public class InactiveUserException : Exception
{
    public InactiveUserException()
        : base("A fiókod inaktív. Kérj segítséget az adminisztrátortól.")
    {
    }
}
