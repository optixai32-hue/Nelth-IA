import { SearchProvider } from './base'
import { DuckDuckGoSearchProvider } from './duckduckgo'

export type SearchProviderType = 'duckduckgo'
export const DEFAULT_PROVIDER: SearchProviderType = 'duckduckgo'

export function createSearchProvider(
  _type?: SearchProviderType
): SearchProvider {
  return new DuckDuckGoSearchProvider()
}

export { DuckDuckGoSearchProvider } from './duckduckgo'
export type { SearchProvider }
