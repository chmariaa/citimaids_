import { useState, useEffect } from 'react';
import api from '../api/axios';

const DEFAULT_SETTINGS = {
  business_name: 'CitiMaids Cleaning Services',
  contact_number: '+971 52 634 9461',
  additional_number: '+971 58 175 3958',
  business_email: 'info@citi-maids.com',
  additional_email: 'citimaidsuae@gmail.com',
  business_address: 'Aljazeera Tower, Room 45, Hamdan St, Abu Dhabi, UAE',
  facebook_url: 'https://web.facebook.com/people/CitiMaids-Cleaning-Services/61550129471847/',
  tiktok_url: 'https://www.tiktok.com/@citimaids?_t=8pO7VCQjaUy&_r=1',
  description: 'Premier residential, commercial, and maintenance services across Abu Dhabi.',
  operating_hours_weekdays: 'Monday – Saturday: 7:00 AM – 9:00 PM',
  operating_hours_sunday: 'Sunday: 8:00 AM – 6:00 PM',
  response_time: 'under 15 minutes',
  homes_cleaned_base: '500',
  completed_cleanings_count: '504',
  booking_time_slots: '8:00 AM, 10:00 AM, 12:00 PM, 2:00 PM, 4:00 PM, 6:00 PM',
  active_cities: 'Abu Dhabi, Dubai, Sharjah',
  timezone: 'Asia/Dubai',
  currency: 'AED',
};

let globalSettings = DEFAULT_SETTINGS;
let globalSettingsPromise = null;

export function clearSettingsCache() {
  globalSettings = DEFAULT_SETTINGS;
  globalSettingsPromise = null;
}

export function useSettings() {
  const [settings, setSettings] = useState(globalSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (globalSettings && globalSettings !== DEFAULT_SETTINGS) {
      return;
    }

    if (!globalSettingsPromise) {
      globalSettingsPromise = api.get('/settings').then((res) => {
        const merged = { ...DEFAULT_SETTINGS, ...res.data };
        globalSettings = merged;
        return merged;
      });
    }

    globalSettingsPromise
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('useSettings fetch error (using defaults):', err);
        setError(err);
        setLoading(false);
        globalSettingsPromise = null;
      });
  }, []);

  return { settings, loading, error };
}
