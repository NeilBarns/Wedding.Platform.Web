import { createBrowserRouter } from 'react-router-dom'
import { HomePage } from '../pages/HomePage'
import { LoginPage } from '../pages/LoginPage'
import { MyEventsPage } from '../pages/MyEventsPage'
import { RegisterPage } from '../pages/RegisterPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/events',
    element: <MyEventsPage />,
  },
])
