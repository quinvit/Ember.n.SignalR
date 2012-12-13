namespace Ember.n.SignalR.Validators
{
    using Ember.n.SignalR.DTOs;
    using FluentValidation;

    public class CustomerValidator: AbstractValidator<Customer>
    {
        public CustomerValidator() {
            RuleFor(customer => customer.FirstName).Matches(@"^[a-zA-Z''-'\s]{1,40}$").NotNull().NotEmpty();
            RuleFor(customer => customer.LastName).Matches(@"^[a-zA-Z''-'\s]{1,40}$").NotNull().NotEmpty();
            RuleFor(customer => customer.Email).Matches(@"^(?("")("".+?""@)|(([0-9a-zA-Z]((\.(?!\.))|[-!#\$%&'\*\+/=\?\^`\{\}\|~\w])*)(?<=[0-9a-zA-Z])@))(?(\[)(\[(\d{1,3}\.){3}\d{1,3}\])|(([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,6}))$").NotNull().NotEmpty();
            RuleFor(customer => customer.Phone).Matches(@"^\(\d{3}\) \d{3}-\d{4}$").NotNull().NotEmpty();
        }
    }
}