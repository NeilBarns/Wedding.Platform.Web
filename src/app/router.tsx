import { createBrowserRouter, Navigate } from 'react-router-dom'
import { GuestRoute, ProtectedRoute, RootRedirect } from '../features/auth/RouteGuards'
import { LoginPage } from '../pages/LoginPage'
import { MyEventsPage } from '../pages/MyEventsPage'
import { RegisterPage } from '../pages/RegisterPage'
import { AuthenticatedLayout } from '../layouts/AuthenticatedLayout'
import { EventWorkspaceLayout } from '../features/events/workspace/EventWorkspaceLayout'
import { WebsitePage } from '../pages/workspace/WebsitePage'
import { InvitationsPage } from '../pages/workspace/InvitationsPage'
import { EventSettingsPage } from '../pages/workspace/EventSettingsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    element: <GuestRoute />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AuthenticatedLayout />,
        children: [
          {
            path: '/events',
            element: <MyEventsPage />,
          },
          {
            path: '/events/:eventId',
            element: <EventWorkspaceLayout />,
            children: [
              {
                index: true,
                element: <Navigate to="website" replace />,
              },
              {
                path: 'website',
                element: <WebsitePage />,
              },
              {
                path: 'invitations',
                element: <InvitationsPage />,
              },
              {
                path: 'settings',
                element: <EventSettingsPage />,
              },
            ],
          },
        ],
      },
    ],
  },
])
