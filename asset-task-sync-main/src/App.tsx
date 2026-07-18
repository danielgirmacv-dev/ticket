import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Assets from "./pages/Assets";
import Tickets from "./pages/Tickets";
import Users from "./pages/Users";
import Calendar from "./pages/Calendar";
import Settings from "./pages/Settings";
import Requests from "./pages/Requests";
import Schedules from "./pages/Schedules";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import ActivityLogs from "./pages/ActivityLogs";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Locations from "./pages/Locations";
import Departments from "./pages/Departments";
import Help from "./pages/Help";
import Faqs from "./pages/Faqs";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/assets" element={
              <ProtectedRoute>
                <Assets />
              </ProtectedRoute>
            } />
            <Route path="/tickets" element={
              <ProtectedRoute>
                <Tickets />
              </ProtectedRoute>
            } />
            <Route path="/tickets/:ticketId" element={
              <ProtectedRoute>
                <Tickets />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Users />
              </ProtectedRoute>
            } />
            <Route path="/locations" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Locations />
              </ProtectedRoute>
            } />
            <Route path="/departments" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Departments />
              </ProtectedRoute>
            } />
            <Route path="/faqs" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Faqs />
              </ProtectedRoute>
            } />
            <Route path="/help" element={
              <ProtectedRoute>
                <Help />
              </ProtectedRoute>
            } />
            <Route path="/activity-logs" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ActivityLogs />
              </ProtectedRoute>
            } />
            <Route path="/calendar" element={
              <ProtectedRoute>
                <Calendar />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/requests" element={
              <ProtectedRoute>
                <Requests />
              </ProtectedRoute>
            } />
            <Route path="/schedules" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Schedules />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute allowedRoles={['admin', 'technician']}>
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
