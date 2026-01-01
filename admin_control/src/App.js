import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { useThemeStore } from "./stores/themeStore";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard").then((m) => ({
    default: m.AdminDashboard,
})));
const AdminUnauthorized = React.lazy(() => import("./pages/admin/Unauthorized").then((m) => ({ default: m.default })));
const MembersPage = React.lazy(() => import("./pages/members/MembersPage").then((m) => ({
    default: m.MembersPage,
})));
const InvitationsPage = React.lazy(() => import("./pages/invitations/InvitationsPage").then((m) => ({
    default: m.InvitationsPage,
})));
const MediaPage = React.lazy(() => import("./pages/media/MediaPage").then((m) => ({ default: m.MediaPage })));
const SettingsPage = React.lazy(() => import("./pages/settings/SettingsPage").then((m) => ({
    default: m.SettingsPage,
})));
const ProfilePage = React.lazy(() => import("./pages/profile/ProfilePage").then((m) => ({
    default: m.ProfilePage,
})));
const AnalyticsPage = React.lazy(() => import("./pages/analytics/AnalyticsPage").then((m) => ({
    default: m.AnalyticsPage,
})));
const ServicesPage = React.lazy(() => import("./pages/services/ServicesPage").then((m) => ({
    default: m.ServicesPage,
})));
const InvitationPageMI = React.lazy(() => import("./modules/membership-initiation/pages/InvitationPage").then((m) => ({
    default: m.InvitationPage,
})));
// The rest of membership-initiation pages will be migrated next
const RegistrationPageMI = React.lazy(() => import("./modules/membership-initiation/pages/RegistrationPage").then((m) => ({
    default: m.RegistrationPage,
})));
const OathPageMI = React.lazy(() => import("./modules/membership-initiation/pages/OathPage").then((m) => ({
    default: m.OathPage,
})));
const SetupPageMI = React.lazy(() => import("./modules/membership-initiation/pages/SetupPage").then((m) => ({
    default: m.SetupPage,
})));
const TelegramConnectPageMI = React.lazy(() => import("./modules/membership-initiation/pages/TelegramConnectPage").then((m) => ({
    default: m.TelegramConnectPage,
})));
const SubmissionConfirmationPageMI = React.lazy(() => import("./modules/membership-initiation/pages/SubmissionConfirmationPage").then((m) => ({
    default: m.SubmissionConfirmationPage,
})));
const MobileConnectPageMI = React.lazy(() => import("./modules/membership-initiation/pages/MobileConnectPage").then((m) => ({
    default: m.MobileConnectPage,
})));
function App() {
    const { theme, initializeTheme } = useThemeStore();
    useEffect(() => {
        initializeTheme();
    }, [initializeTheme]);
    // Apply theme to document
    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark");
    }, [theme]);
    // Direct access to dashboard components
    return (_jsx("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200", children: _jsx(Suspense, { fallback: _jsx("div", { className: "p-6", children: _jsx(LoadingSpinner, { size: "large" }) }), children: _jsxs(Routes, { children: [_jsxs(Route, { element: _jsx(DashboardLayout, {}), children: [_jsx(Route, { path: "/", element: _jsx(AdminDashboard, {}) }), _jsx(Route, { path: "/admin", element: _jsx(AdminDashboard, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(DashboardPage, {}) }), _jsx(Route, { path: "/members", element: _jsx(MembersPage, {}) }), _jsx(Route, { path: "/invitations", element: _jsx(InvitationsPage, {}) }), _jsx(Route, { path: "/services", element: _jsx(ServicesPage, {}) }), _jsx(Route, { path: "/media", element: _jsx(MediaPage, {}) }), _jsx(Route, { path: "/settings", element: _jsx(SettingsPage, {}) }), _jsx(Route, { path: "/profile", element: _jsx(ProfilePage, {}) }), _jsx(Route, { path: "/analytics", element: _jsx(AnalyticsPage, {}) })] }), _jsx(Route, { path: "/membership/invitation", element: _jsx(InvitationPageMI, {}) }), _jsx(Route, { path: "/membership/registration", element: _jsx(RegistrationPageMI, {}) }), _jsx(Route, { path: "/membership/oath", element: _jsx(OathPageMI, {}) }), _jsx(Route, { path: "/membership/setup", element: _jsx(SetupPageMI, {}) }), _jsx(Route, { path: "/membership/telegram-connect", element: _jsx(TelegramConnectPageMI, {}) }), _jsx(Route, { path: "/membership/submission-confirmation", element: _jsx(SubmissionConfirmationPageMI, {}) }), _jsx(Route, { path: "/membership/mobile-connect", element: _jsx(MobileConnectPageMI, {}) }), _jsx(Route, { path: "*", element: _jsx("div", { children: "404 - Page Not Found" }) })] }) }) }));
}
export default App;
