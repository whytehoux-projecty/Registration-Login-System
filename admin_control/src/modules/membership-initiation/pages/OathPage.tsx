import React, { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { Container } from "../components/setup/Container"
import { Card, Button, Checkbox, Alert } from "../components/ui"

interface RegistrationData { firstName?: string; lastName?: string; email?: string; submittedAt?: string }

export const OathPage: React.FC = () => {
  const navigate = useNavigate()

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [recordingDuration, setRecordingDuration] = useState<number>(0)
  const [isVerifying, setIsVerifying] = useState<boolean>(false)
  const [isVerified, setIsVerified] = useState<boolean>(false)
  const recordingTimerRef = useRef<number | null>(null)

  const [acceptedPolicies, setAcceptedPolicies] = useState({
    generalTerms: false,
    privacyPolicy: false,
    codeOfConduct: false,
    ethicalGuidelines: false,
  })

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null)

  useEffect(() => {
    const storedRegistrationData = sessionStorage.getItem("registrationData")
    if (!storedRegistrationData) {
      toast.error("Please complete your registration first.")
      navigate("/membership/registration")
      return
    }
    try {
      const parsed = JSON.parse(storedRegistrationData)
      setRegistrationData(parsed)
    } catch {
      toast.error("Invalid registration data.")
      navigate("/membership/registration")
    }
  }, [navigate])

  const startRecording = async () => {
    setError(null)
    setIsRecording(true)
    setRecordingDuration(0)
    audioChunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        const url = URL.createObjectURL(blob)
        setAudioURL(url)
        stream.getTracks().forEach((t) => t.stop())
      }

      recorder.start()
      recordingTimerRef.current = window.setInterval(() => setRecordingDuration((d) => d + 1), 1000)
    } catch (err) {
      setError("Microphone access denied or unavailable.")
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  const handlePolicyChange = (key: keyof typeof acceptedPolicies) => {
    setAcceptedPolicies((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const verifyAndSubmit = async () => {
    setError(null)
    if (!audioURL) { setError("Please record your oath before submitting."); return }
    const allAccepted = Object.values(acceptedPolicies).every(Boolean)
    if (!allAccepted) { setError("Please accept all policies to continue."); return }

    setIsVerifying(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setIsVerified(true)
      const appData = {
        reference: Math.random().toString(36).substring(2, 9).toUpperCase(),
        name: `${registrationData?.firstName || ""} ${registrationData?.lastName || ""}`.trim(),
        email: registrationData?.email,
        submittedAt: new Date().toISOString(),
      }
      sessionStorage.setItem("applicationSubmitted", JSON.stringify(appData))
      toast.success("Oath verified and application submitted.")
      navigate("/membership/submission-confirmation")
    } catch {
      setError("Verification failed. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`

  return (
    <Container currentPage="Membership Oath">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Record Your Membership Oath</h2>
          <p className="text-gray-600 mb-6">Please record the following oath and accept the policies to proceed.</p>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <p className="text-blue-800">
              "I hereby commit to uphold the values, responsibilities, and ethical standards of the Space community."
            </p>
          </div>

          {error && <Alert type="error" className="mb-4">{error}</Alert>}

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            {!audioURL ? (
              <div className="text-center">
                {isRecording ? (
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <span className="w-4 h-4 bg-red-600 rounded-full animate-pulse"></span>
                    </div>
                    <p className="text-red-600">Recording... {formatTime(recordingDuration)}</p>
                  </div>
                ) : null}
                <div className="flex justify-center gap-3">
                  {!isRecording ? (
                    <Button onClick={startRecording}>Start Recording</Button>
                  ) : (
                    <Button variant="outline" onClick={stopRecording}>Stop Recording</Button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <audio src={audioURL} controls className="w-full mb-3" />
                <Button variant="outline" onClick={() => { setAudioURL(null); setRecordingDuration(0) }}>Re-record</Button>
              </div>
            )}
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-start">
              <Checkbox id="generalTerms" checked={acceptedPolicies.generalTerms} onChange={() => handlePolicyChange("generalTerms")} label="General Terms" />
            </div>
            <div className="flex items-start">
              <Checkbox id="privacyPolicy" checked={acceptedPolicies.privacyPolicy} onChange={() => handlePolicyChange("privacyPolicy")} label="Privacy Policy" />
            </div>
            <div className="flex items-start">
              <Checkbox id="codeOfConduct" checked={acceptedPolicies.codeOfConduct} onChange={() => handlePolicyChange("codeOfConduct")} label="Code of Conduct" />
            </div>
            <div className="flex items-start">
              <Checkbox id="ethicalGuidelines" checked={acceptedPolicies.ethicalGuidelines} onChange={() => handlePolicyChange("ethicalGuidelines")} label="Ethical Guidelines" />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={verifyAndSubmit} disabled={isVerifying || !audioURL}> {isVerifying ? "Verifying..." : "Submit Oath"} </Button>
          </div>
        </Card>
      </div>
    </Container>
  )
}

export default OathPage

