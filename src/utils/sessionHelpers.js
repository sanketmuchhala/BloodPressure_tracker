import { supabase, SINGLE_USER_ID } from './supabase';

/**
 * Calculate averages for multiple blood pressure readings
 * @param {Array} readings - Array of reading objects with systolic, diastolic, pulse
 * @returns {Object|null} - Average values or null if no valid readings
 */
export function calculateAverages(readings) {
  // Filter out readings with incomplete data
  const validReadings = readings.filter(
    (r) => r.systolic && r.diastolic && r.pulse
  );

  if (validReadings.length === 0) {
    return null;
  }

  const sum = validReadings.reduce(
    (acc, r) => ({
      systolic: acc.systolic + parseInt(r.systolic),
      diastolic: acc.diastolic + parseInt(r.diastolic),
      pulse: acc.pulse + parseInt(r.pulse),
    }),
    { systolic: 0, diastolic: 0, pulse: 0 }
  );

  return {
    systolic: Math.round(sum.systolic / validReadings.length),
    diastolic: Math.round(sum.diastolic / validReadings.length),
    pulse: Math.round(sum.pulse / validReadings.length),
    count: validReadings.length,
  };
}

/**
 * Validate individual reading values
 * @param {Object} reading - Reading with systolic, diastolic, pulse
 * @returns {boolean} - True if reading is valid
 */
export function validateReading(reading) {
  const sys = parseInt(reading.systolic);
  const dia = parseInt(reading.diastolic);
  const pul = parseInt(reading.pulse);

  return (
    !isNaN(sys) &&
    !isNaN(dia) &&
    !isNaN(pul) &&
    sys >= 50 &&
    sys <= 250 &&
    dia >= 30 &&
    dia <= 150 &&
    pul >= 30 &&
    pul <= 200
  );
}

/**
 * Save a blood pressure session with multiple readings
 * @param {Object} sessionData - Session metadata (timestamp, photoPath, etc.)
 * @param {Array} readings - Array of individual readings
 * @returns {Promise<Object>} - Created session object
 */
export async function saveSession(sessionData, readings) {
  // Calculate averages from individual readings
  const autoAverages = calculateAverages(readings);
  if (!autoAverages) {
    throw new Error('No valid readings to save');
  }

  // Use overrideAvg if provided (user edited the computed average)
  const averages = sessionData.overrideAvg || autoAverages;

  try {
    // Step 1: Insert session with averages
    const { data: session, error: sessionError } = await supabase
      .from('bp_sessions')
      .insert({
        user_id: SINGLE_USER_ID,
        session_at: sessionData.timestamp,
        reading_count: averages.count ?? autoAverages.count,
        avg_systolic: averages.systolic,
        avg_diastolic: averages.diastolic,
        avg_pulse: averages.pulse,
        photo_path: sessionData.photoPath || null,
      })
      .select()
      .single();

    if (sessionError) {
      throw sessionError;
    }

    // Step 2: Insert individual readings with session_id
    const readingsToInsert = readings
      .filter((r) => validateReading(r))
      .map((r) => ({
        user_id: SINGLE_USER_ID,
        session_id: session.id,
        reading_at: session.session_at,
        systolic: parseInt(r.systolic),
        diastolic: parseInt(r.diastolic),
        pulse: parseInt(r.pulse),
        photo_path: null,
      }));

    const { error: readingsError } = await supabase
      .from('bp_logs')
      .insert(readingsToInsert);

    if (readingsError) {
      // Rollback: Delete session if readings fail
      await supabase.from('bp_sessions').delete().eq('id', session.id);
      throw readingsError;
    }

    return session;
  } catch (error) {
    console.error('Error saving session:', error);
    throw error;
  }
}


/**
 * Fetch all sessions with their individual readings
 * @returns {Promise<Array>} - Array of sessions with nested readings
 */
export async function fetchSessions() {
  try {
    const { data: sessions, error: sessionsError } = await supabase
      .from('bp_sessions')
      .select('*')
      .eq('user_id', SINGLE_USER_ID)
      .order('session_at', { ascending: false })
      .limit(100);

    if (sessionsError) {
      throw sessionsError;
    }

    // Fetch individual readings for each session
    const sessionsWithReadings = await Promise.all(
      sessions.map(async (session) => {
        const { data: readings, error: readingsError } = await supabase
          .from('bp_logs')
          .select('*')
          .eq('session_id', session.id)
          .order('reading_at', { ascending: true });

        if (readingsError) {
          console.error('Error fetching readings:', readingsError);
          return { ...session, readings: [] };
        }

        // Generate signed URL for photo if exists
        let photoUrl = null;
        if (session.photo_path) {
          const { data: signedUrlData } = await supabase.storage
            .from('bp-photos')
            .createSignedUrl(session.photo_path, 3600);

          if (signedUrlData) {
            photoUrl = signedUrlData.signedUrl;
          }
        }

        return {
          ...session,
          readings,
          photoUrl,
          type: 'session', // Mark as session for UI rendering
        };
      })
    );

    return sessionsWithReadings;
  } catch (error) {
    console.error('Error fetching sessions:', error);
    throw error;
  }
}
