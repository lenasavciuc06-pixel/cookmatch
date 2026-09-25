using Frigider.Api.Endpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Frigider.Api.Data;

public sealed class IngredientCatalogCache(IMemoryCache memoryCache, ILogger<IngredientCatalogCache> logger)
{
    private const string CacheKey = "catalog:ingredients";
    private readonly SemaphoreSlim warmupLock = new(1, 1);

    public async Task<IReadOnlyList<IngredientDto>> GetAsync(AppDbContext dbContext, CancellationToken cancellationToken)
    {
        if (memoryCache.TryGetValue(CacheKey, out IReadOnlyList<IngredientDto>? cached) && cached is not null)
        {
            return cached;
        }

        await warmupLock.WaitAsync(cancellationToken);
        try
        {
            if (memoryCache.TryGetValue(CacheKey, out cached) && cached is not null)
            {
                return cached;
            }

            var ingredients = await dbContext.Ingredients
                .AsNoTracking()
                .OrderBy(ingredient => ingredient.Name)
                .Select(ingredient => new IngredientDto(ingredient.Name, ingredient.IsPantryStaple))
                .ToArrayAsync(cancellationToken);

            memoryCache.Set(CacheKey, ingredients, new MemoryCacheEntryOptions
            {
                Priority = CacheItemPriority.NeverRemove
            });

            logger.LogInformation("Ingredient catalog warmed with {Count} items.", ingredients.Length);
            return ingredients;
        }
        finally
        {
            warmupLock.Release();
        }
    }
}

public sealed class IngredientCatalogWarmupService(
    IServiceScopeFactory scopeFactory,
    IngredientCatalogCache catalogCache,
    ILogger<IngredientCatalogWarmupService> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await catalogCache.GetAsync(dbContext, cancellationToken);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogWarning(exception, "Ingredient catalog warmup skipped; the catalog database may not be initialized yet.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
