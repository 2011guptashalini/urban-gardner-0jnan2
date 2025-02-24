/**
 * @fileoverview Route constants for Urban Gardening Assistant application
 * @version 1.0.0
 * 
 * Defines all application routes following RESTful patterns and supporting core features:
 * - Space optimization calculator
 * - Crop planning and management
 * - Yield estimation
 * - Maintenance scheduling
 * - AI-powered recommendations
 */

/**
 * Authentication & Core Routes
 */
export const HOME = '/'
export const LOGIN = '/login'
export const REGISTER = '/register'
export const DASHBOARD = '/dashboard'
export const PROFILE = '/profile'
export const SETTINGS = '/settings'
export const HELP = '/help'

/**
 * Garden Planning & Management Routes
 */
export const GARDEN_PLANNER = '/garden-planner'
export const GARDEN_LIST = '/gardens'
export const GARDEN_DETAIL = '/garden/:id'
export const GARDEN_CREATE = '/garden/create'
export const GARDEN_EDIT = '/garden/:id/edit'
export const GARDEN_DELETE = '/garden/:id/delete'

/**
 * Crop Management Routes
 */
export const CROP_MANAGER = '/crop-manager'
export const CROP_LIST = '/crops'
export const CROP_DETAIL = '/crop/:id'
export const CROP_CREATE = '/crop/create'
export const CROP_EDIT = '/crop/:id/edit'
export const CROP_DELETE = '/crop/:id/delete'

/**
 * Maintenance Scheduling Routes
 */
export const MAINTENANCE_SCHEDULER = '/maintenance-scheduler'
export const MAINTENANCE_LIST = '/maintenance'
export const MAINTENANCE_DETAIL = '/maintenance/:id'
export const MAINTENANCE_CREATE = '/maintenance/create'
export const MAINTENANCE_EDIT = '/maintenance/:id/edit'
export const MAINTENANCE_DELETE = '/maintenance/:id/delete'

/**
 * Calculation & Optimization Tools Routes
 */
export const SPACE_OPTIMIZER = '/space-optimizer'
export const YIELD_CALCULATOR = '/yield-calculator'
export const AI_RECOMMENDATIONS = '/recommendations'

/**
 * Error Routes
 */
export const ERROR_404 = '/404'
export const ERROR_500 = '/500'

/**
 * Consolidated routes object for easy import
 */
export const ROUTES = {
  // Authentication & Core
  HOME,
  LOGIN,
  REGISTER,
  DASHBOARD,
  PROFILE,
  SETTINGS,
  HELP,

  // Garden Planning
  GARDEN_PLANNER,
  GARDEN_LIST,
  GARDEN_DETAIL,
  GARDEN_CREATE,
  GARDEN_EDIT,
  GARDEN_DELETE,

  // Crop Management  
  CROP_MANAGER,
  CROP_LIST,
  CROP_DETAIL,
  CROP_CREATE,
  CROP_EDIT,
  CROP_DELETE,

  // Maintenance
  MAINTENANCE_SCHEDULER,
  MAINTENANCE_LIST,
  MAINTENANCE_DETAIL,
  MAINTENANCE_CREATE,
  MAINTENANCE_EDIT,
  MAINTENANCE_DELETE,

  // Tools & Calculators
  SPACE_OPTIMIZER,
  YIELD_CALCULATOR,
  AI_RECOMMENDATIONS,

  // Error Pages
  ERROR_404,
  ERROR_500
} as const

/**
 * Type-safe route constants
 */
export type Routes = typeof ROUTES