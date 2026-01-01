import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { OathPage } from "../modules/membership-initiation/pages/OathPage";
import { vi } from "vitest";
describe("OathPage", () => {
    beforeEach(() => {
        sessionStorage.clear();
    });
    test("redirects to registration when registrationData missing", async () => {
        render(_jsx(MemoryRouter, { initialEntries: ["/membership/oath"], children: _jsxs(Routes, { children: [_jsx(Route, { path: "/membership/oath", element: _jsx(OathPage, {}) }), _jsx(Route, { path: "/membership/registration", element: _jsx("div", { children: "Registration" }) })] }) }));
        expect(await screen.findByText(/Registration/i)).toBeInTheDocument();
    });
    test("successful submission stores applicationSubmitted", async () => {
        const registrationData = {
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
        };
        sessionStorage.setItem("registrationData", JSON.stringify(registrationData));
        global.navigator.mediaDevices = {
            getUserMedia: vi
                .fn()
                .mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }),
        };
        window.navigator.mediaDevices = global.navigator.mediaDevices;
        class FakeMediaRecorder {
            constructor(stream) {
                this.ondataavailable = () => { };
                this.onstop = () => { };
                this.stream = stream;
            }
            start() { }
            stop() {
                setTimeout(() => {
                    this.ondataavailable({
                        data: new Blob(["audio"], { type: "audio/webm" }),
                    });
                    this.onstop();
                }, 0);
            }
        }
        globalThis.MediaRecorder = FakeMediaRecorder;
        window.MediaRecorder = FakeMediaRecorder;
        globalThis.URL = {
            ...globalThis.URL,
            createObjectURL: vi.fn(() => "blob:audio"),
        };
        window.URL = {
            ...window.URL,
            createObjectURL: vi.fn(() => "blob:audio"),
        };
        render(_jsx(MemoryRouter, { initialEntries: ["/membership/oath"], children: _jsxs(Routes, { children: [_jsx(Route, { path: "/membership/oath", element: _jsx(OathPage, {}) }), _jsx(Route, { path: "/membership/submission-confirmation", element: _jsx("div", { children: "Submitted" }) })] }) }));
        fireEvent.click(screen.getByRole("button", { name: /Start Recording/i }));
        await screen.findByRole("button", { name: /Stop Recording/i });
        fireEvent.click(screen.getByRole("button", { name: /Stop Recording/i }));
        const submitButton = screen.getByRole("button", { name: /Submit Oath/i });
        await waitFor(() => expect(submitButton).not.toBeDisabled());
        fireEvent.click(screen.getByLabelText(/General Terms/i));
        fireEvent.click(screen.getByLabelText(/Privacy Policy/i));
        fireEvent.click(screen.getByLabelText(/Code of Conduct/i));
        fireEvent.click(screen.getByLabelText(/Ethical Guidelines/i));
        fireEvent.click(screen.getByRole("button", { name: /Submit Oath/i }));
        expect(await screen.findByText(/Submitted/i, undefined, { timeout: 4000 })).toBeInTheDocument();
        const stored = sessionStorage.getItem("applicationSubmitted");
        expect(stored).toBeTruthy();
    });
});
