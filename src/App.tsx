import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import Campaigns from "./pages/Campaigns";
import CampaignForm from "./pages/CampaignForm";
import MessageContent from "./pages/MessageContent";
import Events from "./pages/Events";
import EventForm from "./pages/EventForm";
import EventDetails from "./pages/EventDetails";
import Reports from "./pages/Reports";
import Instances from "./pages/Instances";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import PublicEventStatus from "./pages/PublicEventStatus";
import PublicCampaignStatus from "./pages/PublicCampaignStatus";
import CampaignDetails from "./pages/CampaignDetails";
import UserSettings from "./pages/UserSettings";
import OrganizationSettings from "./pages/OrganizationSettings";
import AccessRequest from "./pages/AccessRequest";
import PauseResumeDebug from "./pages/PauseResumeDebug";
import EventCheckin from "./pages/EventCheckin";
import PublicEventCheckin from "./pages/PublicEventCheckin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrganizations from "./pages/AdminOrganizations";
import AdminUsers from "./pages/AdminUsers";
import AdminPlans from "./pages/AdminPlans";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system">
      <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/request-access" element={<AccessRequest />} />
            {/* Public Routes - Must be before catch-all */}
            <Route path="/checkin/:slug" element={<PublicEventCheckin />} />
            <Route path="/public/event/:eventId" element={<PublicEventStatus />} />
            <Route path="/public/campaign-status/:campaignId" element={<PublicCampaignStatus />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/contacts" element={
              <ProtectedRoute>
                <Layout>
                  <Contacts />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/campaigns" element={
              <ProtectedRoute>
                <Layout>
                  <Campaigns />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/campaigns/new" element={
              <ProtectedRoute>
                <Layout>
                  <CampaignForm />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/campaigns/:id" element={
              <ProtectedRoute>
                <Layout>
                  <CampaignDetails />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/campaigns/:id/edit" element={
              <ProtectedRoute>
                <Layout>
                  <CampaignForm />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/message-content" element={
              <ProtectedRoute>
                <Layout>
                  <MessageContent />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/events" element={
              <ProtectedRoute>
                <Layout>
                  <Events />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/events/new" element={
              <ProtectedRoute>
                <Layout>
                  <EventForm />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/events/:id" element={
              <ProtectedRoute>
                <Layout>
                  <EventDetails />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/events/:id/edit" element={
              <ProtectedRoute>
                <Layout>
                  <EventForm />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/events/:id/checkin" element={
              <ProtectedRoute>
                <Layout>
                  <EventCheckin />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/instances" element={
              <ProtectedRoute>
                <Layout>
                  <Instances />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/me" element={
              <ProtectedRoute>
                <Layout>
                  <UserSettings />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/org" element={
              <ProtectedRoute>
                <Layout>
                  <OrganizationSettings />
                </Layout>
              </ProtectedRoute>
            } />
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="saas_admin">
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/organizations" element={
              <ProtectedRoute requiredRole="saas_admin">
                <Layout>
                  <AdminOrganizations />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requiredRole="saas_admin">
                <Layout>
                  <AdminUsers />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/plans" element={
              <ProtectedRoute requiredRole="saas_admin">
                <Layout>
                  <AdminPlans />
                </Layout>
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="/debug/pause-resume" element={
              <ProtectedRoute>
                <Layout>
                  <PauseResumeDebug />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
