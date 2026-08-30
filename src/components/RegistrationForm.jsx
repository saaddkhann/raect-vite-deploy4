import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { battingStyles, bowlingStyles, playingRoles, tournament } from '../data/tournament';
import { cloudinaryConfigured, uploadToCloudinary } from '../services/cloudinary';
import { db, firebaseConfigured } from '../services/firebase';
import { getPlayerNotificationToken, requestNotificationPermission } from '../services/notifications';
import { Field, SelectField, Upload } from './FormField';

const initialForm = {
  name: '', father: '', dob: '', mobile: '', village: '', aadhaar: '',
  playingRole: '', battingStyle: '', bowlingStyle: '', previousExperience: '', utr: ''
};

const maskAadhaar = value => value.replace(/\D/g, '').slice(0, 12).replace(/(\d{4})(?=\d)/g, '$1 ').trim();
const normalizeMobile = value => value.replace(/\D/g, '').slice(0, 10);

export default function RegistrationForm() {
  const [form, setForm] = useState(initialForm);
  {/*const [aadhaarFile, setAadhaarFile] = useState(null); */}
  const [paymentFile, setPaymentFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState('');
  const [notificationStatus, setNotificationStatus] = useState('idle');

  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));

  async function submit(event) {
    event.preventDefault();
    setError('');

    if (!firebaseConfigured || !db) return setError('Firebase is not configured. Add .env values and restart Vite.');
    if (!cloudinaryConfigured()) return setError('Cloudinary is not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to .env and restart Vite.');
    if (!/^[6-9]\d{9}$/.test(form.mobile)) return setError('Enter a valid 10-digit Indian mobile number.');
    if (!form.name.trim() || !form.father.trim() || !form.village.trim()) return setError('Please complete the required player details.');
   {/* if (!aadhaarFile || !paymentFile) return setError('Aadhaar card and payment screenshot are required.');*/}

    setBusy(true);
    try {
      const id = `MGL-${Date.now().toString(36).toUpperCase()}`;

      const [ paymentUrl, photoUrl] = await Promise.all([
        
        uploadToCloudinary(paymentFile, `madanpur-league/${id}/payment`, 'payment'),
        photoFile
          ? uploadToCloudinary(photoFile, `madanpur-league/${id}/photo`, 'photo')
          : Promise.resolve('')
      ]);

      let fcmToken = '';
      if (notificationStatus === 'requested') {
        try { fcmToken = await getPlayerNotificationToken(); } catch (_) { /* registration still works */ }
      }

      await setDoc(doc(collection(db, 'registrations'), id), {
        ...form,
        name: form.name.trim(),
        father: form.father.trim(),
        village: form.village.trim(),
        mobile: `+91${form.mobile}`,
        aadhaar: form.aadhaar.replace(/\D/g, '').slice(-4).padStart(4, '*'),
        registrationId: id,
        
        paymentUrl,
        photoUrl,
        status: 'pending',
        paymentStatus: 'submitted',
        notificationsEnabled: Boolean(fcmToken),
        fcmToken,
        notificationStatus: fcmToken ? 'enabled' : 'not_requested',
        notificationError: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setDone(id);
    } catch (err) {
      setError(err?.message || 'Registration failed.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className="success">
        <h1>Registration Submitted 🎉</h1>
        <div className="ticket">
          <p>Your Registration ID</p>
          <strong>{done}</strong>
          <p>Keep this ID for future communication. Your application is pending admin verification.</p>
        </div>
        <a className="btn" href="#register" onClick={() => {
          setDone(null); setForm(initialForm); setAadhaarFile(null); setPaymentFile(null); setPhotoFile(null); setNotificationStatus('idle');
        }}>Register another player</a>
      </main>
    );
  }

  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow" style={{fontSize: '2.25rem', fontFamily: 'var(--font-secondary)'}}>MADANPUR GRAMIN CIRCLE CRICKET LEAGUE TOURNAMENT</p>
          <h1>Player <em>Registration</em></h1>
          <p>Submit your player profile, payment proof and identity document.</p>
        </div>
        <div className="qr">
          <img style={{ maxWidth: '100%', height: 'auto' }} src={tournament.payment.qrImage} alt="Tournament UPI QR Code" />
          <small style={{ color: 'blue' ,fontSize: '1.25rem' }}>Scan to pay ₹{tournament.payment.registrationFee}</small>
        </div>
      </section>

      <form onSubmit={submit}>
        <h2>Player Details</h2>
        <div className="grid">
          <Field label="Player Name" required value={form.name} onChange={v => update('name', v)} />
          <Field label="Father's Name" required value={form.father} onChange={v => update('father', v)} />
          <Field label="Date of Birth" type="date" value={form.dob} onChange={v => update('dob', v)} />
          <Field label="Mobile Number" required value={form.mobile} onChange={v => update('mobile', normalizeMobile(v))} placeholder="10-digit mobile number" inputMode="numeric" />
          <Field label="Village / Address" required value={form.village} onChange={v => update('village', v)} />
          <Field label="Aadhaar Number (last 4 stored)" value={form.aadhaar} onChange={v => update('aadhaar', maskAadhaar(v))} placeholder="XXXX XXXX 1234" inputMode="numeric" />
        </div>

        <div className="grid uploads">
          {/*<Upload label="Aadhaar Card" required file={aadhaarFile} setFile={setAadhaarFile} /> */}
          <Upload label="Player Photo" required file={photoFile} setFile={setPhotoFile}  accept="image/jpeg,image/png,image/webp" preview />
          <Upload label="Payment Screenshot" required file={paymentFile} setFile={setPaymentFile} accept="image/jpeg,image/png,image/webp" preview />
        </div>

        <h2>Cricket Profile</h2>
        <div className="grid">
          <SelectField label="Playing Role" required value={form.playingRole} onChange={v => update('playingRole', v)} options={playingRoles} />
          <SelectField label="Batting Style" required value={form.battingStyle} onChange={v => update('battingStyle', v)} options={battingStyles} />
          <SelectField label="Bowling Style" value={form.bowlingStyle} onChange={v => update('bowlingStyle', v)} options={bowlingStyles} />
        {/*}  <label className="full-width">
            <span>Previous Cricket Experience</span>
            <textarea maxLength="1000" value={form.previousExperience} placeholder="Teams, tournaments, years played, achievements, etc." onChange={e => update('previousExperience', e.target.value)} />
          </label> */}
        </div>

        <h2>Payment</h2>
        <div className="payment">
          <div>
            <b>Registration Fee</b><h3>₹{tournament.payment.registrationFee}</h3>
            <p>Scan the QR code above using any UPI app.</p>
          {/*}  <label>UPI ID</label><div className="upi">{tournament.payment.upiId}</div> */}
          </div>
          <div>
            <Field label="UTR / Transaction Reference" required value={form.utr} onChange={v => update('utr', v)} />
          </div>
        </div>

        <div className="sms-note">🔔 <b>Free status notifications:</b> Enable browser notifications below to receive an alert when your registration is approved or rejected.</div>
        <div className="notification-optin">
          <label className="check">
            <input
              type="checkbox"
              checked={notificationStatus === 'requested' || notificationStatus === 'working'}
              onChange={async e => {
                if (!e.target.checked) { setNotificationStatus('idle'); return; }
                setNotificationStatus('working'); setError('');
                try {
                  const result = await requestNotificationPermission();
                  setNotificationStatus(result.ok ? 'requested' : result.reason);
                  if (!result.ok) setError(result.reason === 'denied' ? 'Notifications are blocked. Enable them in your browser settings.' : 'Free notifications are unavailable or not configured yet.');
                } catch (err) { setNotificationStatus('error'); setError(err?.message || 'Could not enable notifications.'); }
              }}
            />
            I want free browser notifications for approval/rejection updates.
          </label>
          <small>Recommended: enable this before submitting. The FCM token is attached to your registration after submission.</small>
        </div>

        {error && <div className="error">{error}</div>}
        <label className="check"><input type="checkbox" required /> I confirm that the information provided is correct and I agree to the tournament rules and privacy notice.</label>
        <button className="btn" disabled={busy}>{busy ? 'Uploading & submitting…' : 'Submit Registration'}</button>
      </form>
    </main>
  );
}
