import { Routes, Route, Navigate } from 'react-router-dom';
import { InvitationPage } from './pages/InvitationPage';
import { RegistrationPage } from './pages/RegistrationPage';
import { OathPage } from './pages/OathPage';
import { CompletePage } from './pages/CompletePage';
import { LandingPage } from './pages/LandingPage';
import { InterestPage } from './pages/InterestPage';

function App() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900">
            <Routes>
                {/* Landing page */}
                <Route path="/" element={<LandingPage />} />

                {/* Registration flow */}
                <Route path="/interest" element={<InterestPage />} />
                <Route path="/invitation" element={<InvitationPage />} />
                <Route path="/register" element={<RegistrationPage />} />
                <Route path="/oath" element={<OathPage />} />
                <Route path="/complete" element={<CompletePage />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
}

export default App;
