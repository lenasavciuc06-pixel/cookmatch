const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const dir = path.join(__dirname, '../backend/Frigider.Api/Data/Seed');
const recipes = JSON.parse(fs.readFileSync(path.join(dir, 'recipes.json'), 'utf8')).recipes;
const ingredients = JSON.parse(fs.readFileSync(path.join(dir, 'ingredients.json'), 'utf8')).ingredients;
const original = JSON.parse(fs.readFileSync(path.join(__dirname, 'original-recipes.json'), 'utf8')).recipes;
const known = new Set(ingredients.map(i => i.Name));
assert.equal(recipes.length, 300);
assert.equal(new Set(recipes.map(r => r.Slug)).size, 300);
assert.equal(new Set(recipes.map(r => r.Name)).size, 300);
assert.equal(new Set(recipes.map(r => r.Translations.en.Name)).size, 300);
let stages = 0;
for (const recipe of recipes) {
  assert.ok(recipe.Servings > 0 && recipe.Ingredients.length >= 3, recipe.Slug);
  assert.equal(new Set(recipe.Ingredients.map(i => i.Name)).size, recipe.Ingredients.length, recipe.Slug);
  for (const ingredient of recipe.Ingredients) {
    assert.ok(known.has(ingredient.Name), recipe.Slug + ': unknown ingredient ' + ingredient.Name);
    assert.ok(ingredient.Quantity.trim().length > 0);
  }
  const ro = recipe.Instructions;
  const en = recipe.Translations.en.Instructions;
  assert.ok(ro.length >= 4, recipe.Slug);
  assert.equal(en.length, ro.length, recipe.Slug);
  for (const [lang, instructions] of [['ro', ro], ['en', en]]) {
    let minutes = 0;
    for (const instruction of instructions) {
      const parts = /^\[(\d+) min\] ([\s\S]+)\n(?:Aspect|Look for): ([\s\S]+)$/.exec(instruction);
      assert.ok(parts, `${recipe.Slug} (${lang}): invalid stage`);
      assert.ok(Number(parts[1]) > 0 && parts[2].length >= 30 && parts[3].length >= 20, recipe.Slug + ': stage lacks detail');
      assert.ok(!/[\uFFFD]|\?\?/.test(instruction), recipe.Slug + ': broken encoding');
      minutes += Number(parts[1]);
    }
    assert.equal(minutes, recipe.PrepTimeMinutes, recipe.Slug + ': total time does not match stages');
  }
  assert.deepEqual(ro.map(s => Number(s.match(/^\[(\d+)/)[1])), en.map(s => Number(s.match(/^\[(\d+)/)[1])));
  stages += ro.length;
}
for (const previous of original) {
  const current = recipes.find(r => r.Slug === previous.Slug);
  assert.ok(current, previous.Slug + ': original missing');
  for (const field of ['Name','ImageUrl','Category','Servings','Ingredients']) assert.deepEqual(current[field], previous[field]);
}
console.log(`Validated 300 unique recipes, ${stages} stages per language, ${ingredients.length} ingredient entries; all 30 original identities and ingredient lists preserved.`);
