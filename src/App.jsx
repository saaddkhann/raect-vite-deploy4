import React,{useEffect,useState} from 'react';
import Header from './components/Header';
import RegistrationForm from './components/RegistrationForm';
import Admin from './components/Admin';
import { attachForegroundNotificationListener } from './services/notifications';
import './style.css';

export default function App(){
 const[page,setPage]=useState(location.hash==='#admin'?'admin':'register');
 const[notice,setNotice]=useState(null);
 useEffect(()=>{const f=()=>setPage(location.hash==='#admin'?'admin':'register');addEventListener('hashchange',f);return()=>removeEventListener('hashchange',f)},[]);
 useEffect(()=>{
   let unsubscribe=()=>{};
   attachForegroundNotificationListener((payload)=>{
     setNotice({title:payload.notification?.title||'Tournament Update',body:payload.notification?.body||'You have a new tournament update.'});
     window.setTimeout(()=>setNotice(null),9000);
   }).then(fn=>{unsubscribe=fn||(()=>{})});
   return()=>unsubscribe();
 },[]);
 return <><Header/>{notice&&<div className="notification-banner" role="status"><div><strong>{notice.title}</strong><p>{notice.body}</p></div><button onClick={()=>setNotice(null)} aria-label="Close notification">×</button></div>}{page==='admin'?<Admin/>:<RegistrationForm/>}</>;
}
