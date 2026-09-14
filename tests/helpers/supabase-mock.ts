// A minimal stand-in for Supabase's chainable, thenable query builder.
// Every intermediate method (select/eq/order/...) returns the same chain
// object; awaiting the chain at any point resolves to `result`, matching
// how @supabase/supabase-js's PostgrestFilterBuilder actually behaves.
export function makeChain(result: unknown) {
  const chain: Record<string, unknown> = {
    select: () => chain,
    eq: () => chain,
    neq: () => chain,
    in: () => chain,
    order: () => chain,
    limit: () => chain,
    single: () => chain,
    insert: () => chain,
    update: () => chain,
    delete: () => chain,
    upsert: () => chain,
    then: (resolve: (value: unknown) => void) => resolve(result),
  };
  return chain;
}
