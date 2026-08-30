import { signOut } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { defaultTeams } from '../data/tournament';
import { auth, db } from '../services/firebase';

function Stat({ title, value }) { return <div className="stat"><small>{title}</small><strong>{value}</strong></div>; }

export default function AdminDashboard() {
  const [rows, setRows] = useState([]);
  const [teams, setTeams] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const snapshot = await getDocs(query(collection(db, 'registrations'), orderBy('createdAt', 'desc')));
      const teamSnapshot = await getDocs(collection(db, 'teams'));
      setRows(snapshot.docs.map(item => ({ id: item.id, ...item.data() })));
      setTeams(teamSnapshot.docs.length
        ? teamSnapshot.docs.map(item => ({ id: item.id, ...item.data() }))
        : defaultTeams.map((name, i) => ({ id: String(i), name })));
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const shown = useMemo(() => rows.filter(row =>
    (filter === 'all' || row.status === filter) &&
    JSON.stringify(row).toLowerCase().includes(search.toLowerCase())
  ), [rows, filter, search]);

  async function changeStatus(row, status) {
    const rejectionReason = status === 'rejected'
      ? (window.prompt('Reason for rejection:', row.rejectionReason || '') || '')
      : '';
    await updateDoc(doc(db, 'registrations', row.id), {
      status,
      rejectionReason,
      updatedAt: serverTimestamp()
    });
    await load();
  }

  async function assignTeam(row, team) {
    await updateDoc(doc(db, 'registrations', row.id), { team, updatedAt: serverTimestamp() });
    await load();
  }

  async function resendNotification(row) {
    if (!['approved', 'rejected'].includes(row.status)) return;
    if (!row.fcmToken) return window.alert('This player has not enabled browser notifications.');
    await updateDoc(doc(db, 'registrations', row.id), {
      notificationRequestId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      updatedAt: serverTimestamp()
    });
    await load();
  }

  async function saveEdit() {
    await updateDoc(doc(db, 'registrations', editing.id), {
      name: editing.name || '', father: editing.father || '', mobile: editing.mobile || '', village: editing.village || '',
      playingRole: editing.playingRole || '', battingStyle: editing.battingStyle || '', bowlingStyle: editing.bowlingStyle || '',
      previousExperience: editing.previousExperience || '', utr: editing.utr || '', team: editing.team || '', updatedAt: serverTimestamp()
    });
    setEditing(null);
    await load();
  }

  async function addTeam() {
    const name = teamName.trim();
    if (!name) return;
    await addDoc(collection(db, 'teams'), { name, createdAt: serverTimestamp() });
    setTeamName('');
    await load();
  }

  async function removeTeam(team) {
    if (!window.confirm(`Delete ${team.name}? Existing players keep their assigned text until changed.`)) return;
    await deleteDoc(doc(db, 'teams', team.id));
    await load();
  }

  function exportFile(type) {
    const data = rows.map(({ id, aadhaar, aadhaarUrl, ...row }) => ({
      ...row,
      firestoreId: id,
      playerPhotoUrl: row.photoUrl || '',
      paymentScreenshotUrl: row.paymentUrl || ''
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');
    XLSX.writeFile(workbook, `madanpur-registrations.${type === 'csv' ? 'csv' : 'xlsx'}`, type === 'csv' ? { bookType: 'csv' } : undefined);
  }

  return (
    <main>
      <div className="dashhead">
        <div><p className="eyebrow">CONTROL ROOM</p><h1>Registrations</h1></div>
        <div className="actions">
          <button className="btn secondary" onClick={() => exportFile('xlsx')}>Excel</button>
          <button className="btn secondary" onClick={() => exportFile('csv')}>CSV</button>
          <button className="btn" onClick={load}>{loading ? 'Loading…' : 'Refresh'}</button>
          <button className="btn danger" onClick={() => signOut(auth)}>Logout</button>
        </div>
      </div>

      <div className="stats">
        <Stat title="Total" value={rows.length} />
        <Stat title="Pending" value={rows.filter(x => x.status === 'pending').length} />
        <Stat title="Approved" value={rows.filter(x => x.status === 'approved').length} />
        <Stat title="Rejected" value={rows.filter(x => x.status === 'rejected').length} />
      </div>

      <section className="panel">
        <h2>Team Management</h2>
        <div className="team-manager">
          {teams.map(team => <span key={team.id}>{team.name}<button onClick={() => removeTeam(team)}>×</button></span>)}
          <input placeholder="New team name" value={teamName} onChange={e => setTeamName(e.target.value)} />
          <button onClick={addTeam}>Add Team</button>
        </div>
      </section>

      <div className="toolbar">
        <input placeholder="Search player, mobile, ID, team…" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="tabs">{['all', 'pending', 'approved', 'rejected'].map(value => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{value}</button>)}</div>
      </div>

      <div className="tablewrap">
        <table>
          <thead><tr><th>ID</th><th>Player</th><th>Photo</th><th>Cricket Profile</th><th>Contact</th><th>Team</th><th>Payment</th><th>Status</th><th>Notifications</th><th>Documents</th><th>Actions</th></tr></thead>
          <tbody>
            {shown.map(row => (
              <tr key={row.id}>
                <td>{row.registrationId}</td>
                <td><b>{row.name}</b><br /><small>{row.father}</small></td>
                <td>{row.photoUrl ? <a href={row.photoUrl} target="_blank" rel="noreferrer"><img className="player-thumb" src={row.photoUrl} alt={`${row.name || 'Player'} photo`} /></a> : <small>No photo</small>}</td>
                <td>{row.playingRole}<br />{row.battingStyle}<br />{row.bowlingStyle || 'No bowling'}<br /><small className="experience">{row.previousExperience || 'No experience note'}</small></td>
                <td>{row.mobile}<br />{row.village}</td>
                <td><select value={row.team || ''} onChange={e => assignTeam(row, e.target.value)}><option value="">Unassigned</option>{teams.map(team => <option key={team.id} value={team.name}>{team.name}</option>)}</select></td>
                <td>{row.utr}<br /><span className="badge">{row.paymentStatus}</span></td>
                <td><span className={`badge ${row.status}`}>{row.status}</span>{row.rejectionReason && <small>{row.rejectionReason}</small>}</td>
                <td><span className={`badge ${row.notificationStatus || 'not_requested'}`}>{row.notificationStatus || 'not_requested'}</span>{row.notificationError && <small>{row.notificationError}</small>}{['approved', 'rejected'].includes(row.status) && <button onClick={() => resendNotification(row)}>Resend</button>}</td>
                <td className="doc-links">{row.aadhaarUrl && <a href={row.aadhaarUrl} target="_blank" rel="noreferrer">Aadhaar</a>}{row.paymentUrl && <a href={row.paymentUrl} target="_blank" rel="noreferrer">Payment</a>}</td>
                <td><button onClick={() => setEditing({ ...row })}>Edit</button> <button onClick={() => changeStatus(row, 'approved')}>Approve</button> <button onClick={() => changeStatus(row, 'rejected')}>Reject</button></td>
              </tr>
            ))}
            {!shown.length && <tr><td colSpan="11"><div className="empty">No registrations found.</div></td></tr>}
          </tbody>
        </table>
      </div>

      {editing && <div className="modal"><div className="modalbox">
        <h2>Edit Player</h2>
        {editing.photoUrl && <img className="edit-photo" src={editing.photoUrl} alt="Player" />}
        <div className="grid">
          {['name', 'father', 'mobile', 'village', 'playingRole', 'battingStyle', 'bowlingStyle', 'utr', 'team'].map(key => <label key={key}><span>{key}</span><input value={editing[key] || ''} onChange={e => setEditing({ ...editing, [key]: e.target.value })} /></label>)}
          <label className="full-width"><span>Previous Experience</span><textarea value={editing.previousExperience || ''} onChange={e => setEditing({ ...editing, previousExperience: e.target.value })} /></label>
        </div>
        <div className="actions"><button className="btn secondary" onClick={() => setEditing(null)}>Cancel</button><button className="btn" onClick={saveEdit}>Save Changes</button></div>
      </div></div>}
    </main>
  );
}
