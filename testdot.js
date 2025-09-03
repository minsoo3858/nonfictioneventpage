// testdot.js
// Supabase non_events 테이블에 이벤트 기록 테스트
import { supabase } from "./supabaseClient.js";

async function logTestEvent() {
  const userId = "test-user";
  const eventType = "test_event";
  const eventValue = { message: "테스트 기록" };
  const { data, error } = await supabase.from("non_events").insert([
    {
      user_id: userId,
      event_type: eventType,
      event_value: eventValue,
    },
  ]);
  if (error) {
    console.error("Supabase insert error:", error);
  } else {
    console.log("Supabase insert success:", data);
  }
}

logTestEvent();
