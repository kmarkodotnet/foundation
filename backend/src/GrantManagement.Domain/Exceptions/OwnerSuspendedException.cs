namespace GrantManagement.Domain.Exceptions;

public class OwnerSuspendedException : Exception
{
    public OwnerSuspendedException()
        : base("A szervezeted hozzáférése jelenleg fel van függesztve.") { }
}
