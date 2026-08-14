import { createBrowserRouter } from 'react-router-dom'
import { GuestRoute, ProtectedRoute, RootRedirect } from '../features/auth/RouteGuards'
import { LoginPage } from '../pages/LoginPage'
import { MyEventsPage } from '../pages/MyEventsPage'
import { RegisterPage } from '../pages/RegisterPage'
import { AuthenticatedLayout } from '../layouts/AuthenticatedLayout'
import { EventWorkspacePlaceholderPage } from '../pages/EventWorkspacePlaceholderPage'

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
            element: <EventWorkspacePlaceholderPage />,
          },
        ],
      },
    ],
  },
])
