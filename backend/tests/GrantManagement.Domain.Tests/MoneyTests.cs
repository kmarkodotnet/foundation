using FluentAssertions;
using GrantManagement.Domain.Exceptions;
using GrantManagement.Domain.ValueObjects;

namespace GrantManagement.Domain.Tests;

public class MoneyTests
{
    [Fact]
    public void Constructor_NegativeAmount_ThrowsDomainException()
    {
        var act = () => new Money(-1, "HUF");
        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Add_SameCurrency_ReturnsSummed()
    {
        var a = new Money(100, "HUF");
        var b = new Money(200, "HUF");

        var result = a.Add(b);

        result.Amount.Should().Be(300);
        result.Currency.Should().Be("HUF");
    }

    [Fact]
    public void Add_DifferentCurrency_ThrowsDomainException()
    {
        var huf = new Money(100, "HUF");
        var eur = new Money(100, "EUR");

        var act = () => huf.Add(eur);

        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void FromHuf_CreatesHufMoney()
    {
        var money = Money.FromHuf(1000);
        money.Currency.Should().Be("HUF");
        money.Amount.Should().Be(1000);
    }

    [Fact]
    public void Zero_ReturnsZeroHuf()
    {
        var zero = Money.Zero;
        zero.Amount.Should().Be(0);
        zero.Currency.Should().Be("HUF");
    }

    [Fact]
    public void PercentageOf_ZeroTotal_ReturnsZero()
    {
        var amount = Money.FromHuf(100);
        var total = Money.Zero;

        var result = amount.PercentageOf(total);

        result.Should().Be(0);
    }
}
