import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

def send_admin_notification(subject: str, message: str) -> bool:
    """
    Send email notification to admin
    Called when new user registers
    """
    try:
        # Create email
        msg = MIMEMultipart()
        msg['From'] = settings.SMTP_USER
        msg['To'] = settings.ADMIN_EMAIL
        msg['Subject'] = subject
        
        msg.attach(MIMEText(message, 'plain'))
        
        # Send email
        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
            server.quit()
            return True
        else:
            # Email not configured, just log it
            print(f"Would send email: {subject}")
            return False
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

def notify_user_approval(email: str, username: str) -> bool:
    """
    Send email to user when their registration is approved
    """
    subject = "Your Registration Has Been Approved"
    message = f"""
Hello {username},

Your registration has been approved! You can now use your account to login to our services.

You can now scan QR codes with your mobile app to authenticate.

Welcome aboard!
    """
    
    try:
        msg = MIMEMultipart()
        msg['From'] = settings.SMTP_USER
        msg['To'] = email
        msg['Subject'] = subject
        msg.attach(MIMEText(message, 'plain'))
        
        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
            server.quit()
            return True
        else:
            print(f"Would send approval email to {email}")
            return False
    except Exception as e:
        print(f"Failed to send approval email: {e}")
        return False


def send_user_notification(email: str, subject: str, message: str) -> bool:
    """
    Send email notification to a specific user
    Generic function for sending any email to users
    """
    try:
        msg = MIMEMultipart()
        msg['From'] = settings.SMTP_USER
        msg['To'] = email
        msg['Subject'] = subject
        msg.attach(MIMEText(message, 'plain'))
        
        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
            server.quit()
            return True
        else:
            print(f"Would send email to {email}: {subject}")
            return False
    except Exception as e:
        print(f"Failed to send email to {email}: {e}")
        return False