using Microsoft.EntityFrameworkCore.Query;
using System.Linq.Expressions;

namespace GrantManagement.Application.Tests.Common;

internal class TestAsyncQueryProvider<TEntity> : IAsyncQueryProvider
{
    private readonly IQueryProvider _innerProvider;

    public TestAsyncQueryProvider(IQueryProvider innerProvider)
        => _innerProvider = innerProvider;

    public IQueryable CreateQuery(Expression expression)
        => new TestAsyncEnumerable<TEntity>(expression);

    public IQueryable<TElement> CreateQuery<TElement>(Expression expression)
        => new TestAsyncEnumerable<TElement>(expression);

    public object? Execute(Expression expression)
        => _innerProvider.Execute(expression);

    public TResult Execute<TResult>(Expression expression)
        => _innerProvider.Execute<TResult>(expression);

    public TResult ExecuteAsync<TResult>(Expression expression, CancellationToken cancellationToken = default)
    {
        var resultType = typeof(TResult).GetGenericArguments()[0];

        // Use the generic Execute<T> overload explicitly via MakeGenericMethod
        var executeGenericMethod = typeof(IQueryProvider)
            .GetMethods()
            .First(m => m.Name == nameof(IQueryProvider.Execute) && m.IsGenericMethod)
            .MakeGenericMethod(resultType);

        var result = executeGenericMethod.Invoke(_innerProvider, [expression]);

        var fromResultMethod = typeof(Task)
            .GetMethods()
            .First(m => m.Name == nameof(Task.FromResult) && m.IsGenericMethod)
            .MakeGenericMethod(resultType);

        return (TResult)fromResultMethod.Invoke(null, [result])!;
    }
}

internal class TestAsyncEnumerable<T> : EnumerableQuery<T>, IAsyncEnumerable<T>, IQueryable<T>
{
    public TestAsyncEnumerable(IEnumerable<T> enumerable) : base(enumerable) { }
    public TestAsyncEnumerable(Expression expression) : base(expression) { }

    IQueryProvider IQueryable.Provider => new TestAsyncQueryProvider<T>(this);

    public IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken cancellationToken = default)
        => new TestAsyncEnumerator<T>(this.AsEnumerable().GetEnumerator());
}

internal class TestAsyncEnumerator<T> : IAsyncEnumerator<T>
{
    private readonly IEnumerator<T> _innerEnumerator;

    public TestAsyncEnumerator(IEnumerator<T> innerEnumerator)
        => _innerEnumerator = innerEnumerator;

    public T Current => _innerEnumerator.Current;

    public ValueTask<bool> MoveNextAsync() => new(_innerEnumerator.MoveNext());

    public ValueTask DisposeAsync()
    {
        _innerEnumerator.Dispose();
        return ValueTask.CompletedTask;
    }
}
