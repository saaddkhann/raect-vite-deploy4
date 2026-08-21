const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const { FieldValue } = require('firebase-admin/firestore');

initializeApp();

function buildMessage(after, registrationId) {
  const approved = after.status === 'approved';
  const title = approved ? 'Registration Approved 🏏' : 'Registration Update';
  const body = approved
    ? `Congratulations ${after.name || 'Player'}! Your registration ${after.registrationId || registrationId} has been approved. Team: ${after.team || 'Not assigned'}.`
    : `Your registration ${after.registrationId || registrationId} was rejected. Reason: ${after.rejectionReason || 'Please contact the tournament admin.'}`;

  return {
    notification: { title, body },
    data: {
      registrationId: String(after.registrationId || registrationId),
      status: String(after.status),
      link: '/#register'
    }
  };
}

exports.sendRegistrationNotification = onDocumentUpdated(
  { document: 'registrations/{registrationId}', region: 'asia-south1' },
  async event => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after) return;

    const statusChanged = before.status !== after.status && ['approved', 'rejected'].includes(after.status);
    const manualResend = (before.notificationRequestId || null) !== (after.notificationRequestId || null) && !!after.notificationRequestId;
    if (!statusChanged && !manualResend) return;
    if (!['approved', 'rejected'].includes(after.status)) return;

    const token = after.fcmToken;
    if (!token) {
      await event.data.after.ref.update({
        notificationStatus: 'unavailable',
        notificationError: 'Player has not enabled browser notifications.',
        notificationUpdatedAt: FieldValue.serverTimestamp()
      });
      return;
    }

    try {
      await event.data.after.ref.update({
        notificationStatus: 'sending',
        notificationError: '',
        notificationUpdatedAt: FieldValue.serverTimestamp()
      });

      const response = await getMessaging().send({
        token,
        ...buildMessage(after, event.params.registrationId),
        webpush: {
          notification: {
            title: after.status === 'approved' ? 'Registration Approved 🏏' : 'Registration Update',
            body: after.status === 'approved'
              ? `Your registration ${after.registrationId || event.params.registrationId} has been approved.`
              : `Your registration was rejected. ${after.rejectionReason || ''}`,
            icon: '/icon-192.png'
          }
        }
      });

      await event.data.after.ref.update({
        notificationStatus: 'sent',
        notificationMessageId: response,
        notificationSentAt: FieldValue.serverTimestamp(),
        notificationUpdatedAt: FieldValue.serverTimestamp(),
        notificationError: ''
      });
    } catch (error) {
      await event.data.after.ref.update({
        notificationStatus: 'failed',
        notificationError: error?.message || 'Notification sending failed',
        notificationUpdatedAt: FieldValue.serverTimestamp()
      });
    }
  }
);
