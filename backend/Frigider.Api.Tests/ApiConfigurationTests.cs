using System.Text.Json;
using System.Text.Json.Serialization;
using Frigider.Api.Extensions;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Xunit;

namespace Frigider.Api.Tests;

public class ApiConfigurationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ApiConfigurationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public void JsonOptions_ConfiguredWithCamelCaseAndStringEnumConverter()
    {
        var options = _factory.Services.GetRequiredService<IOptions<Microsoft.AspNetCore.Http.Json.JsonOptions>>().Value;

        Assert.Equal(JsonNamingPolicy.CamelCase, options.SerializerOptions.PropertyNamingPolicy);
        Assert.Contains(options.SerializerOptions.Converters, converter => converter is JsonStringEnumConverter);
    }

    [Fact]
    public async Task Cors_DevelopmentPolicy_AllowsFrontendLocalhost()
    {
        var corsOptions = _factory.Services.GetRequiredService<IOptions<CorsOptions>>().Value;
        var policy = corsOptions.GetPolicy(ServiceCollectionExtensions.FrontendCorsPolicyName);

        Assert.NotNull(policy);
        Assert.Contains("http://localhost:5173", policy.Origins);
        Assert.Contains("http://127.0.0.1:5173", policy.Origins);
    }
}

