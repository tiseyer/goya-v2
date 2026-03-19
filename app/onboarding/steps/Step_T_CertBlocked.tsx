'use client';

import BlockedScreen from '../components/BlockedScreen';

export default function Step_T_CertBlocked() {
  return (
    <BlockedScreen message="You have indicated that your certificate is not the official certificate issued by your school. As a result, we are unable to process your registration at this time. Please contact your school directly to obtain the official certificate." />
  );
}
