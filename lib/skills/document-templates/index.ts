import type { TemplateDef } from './types'

import defaultTpl from './default'
import minimal from './minimal'
import report from './report'
import cv from './cv'
import resume from './resume'
import portfolio from './portfolio'
import invoice from './invoice'
import brochure from './brochure'
import magazine from './magazine'
import certificate from './certificate'
import proposal from './proposal'

/**
 * Template registry. Each document type (cv, invoice, report, certificate, …)
 * is its own module under this folder, so the AI Builder can add new layouts
 * simply by dropping a file here and registering it below.
 */
export const TEMPLATES: Record<string, TemplateDef> = {
  default: defaultTpl,
  minimal,
  report,
  cv,
  resume,
  portfolio,
  invoice,
  brochure,
  magazine,
  certificate,
  proposal
}

export function getTemplate(name: string): TemplateDef {
  return TEMPLATES[name] ?? TEMPLATES.default
}

export function listTemplates(): string[] {
  return Object.keys(TEMPLATES)
}
