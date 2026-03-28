import { createClient } from "@supabase/supabase-js";

import type { Database } from "../lib/supabase/database.types";
import {
  requireServiceRoleKey,
  supabaseUrl
} from "../lib/supabase/env";

type SeedUser = {
  email: string;
  fullName: string;
  role: "owner" | "member";
};

const demoPassword = process.env.SEED_DEMO_PASSWORD ?? "ChangeMe123!";

const seedUsers: SeedUser[] = [
  {
    email: "owner@apm.local",
    fullName: "Aliya Karimova",
    role: "owner"
  },
  {
    email: "member@apm.local",
    fullName: "Bekzod Rasulov",
    role: "member"
  }
];

const apartments: Database["public"]["Tables"]["apartments"]["Insert"][] = [
  {
    id: "0f67ea44-d06d-4f1a-91ce-ae3017d1f001",
    title: "Riverside Loft",
    address: "12 Amir Temur Avenue, Tashkent",
    base_price: 85,
    status: "active",
    notes: "Popular for short city stays."
  },
  {
    id: "0f67ea44-d06d-4f1a-91ce-ae3017d1f002",
    title: "Chorsu Studio",
    address: "44 Chorsu Street, Tashkent",
    base_price: 62,
    status: "active",
    notes: "Compact unit with easy old-city access."
  },
  {
    id: "0f67ea44-d06d-4f1a-91ce-ae3017d1f003",
    title: "Central Park Residence",
    address: "7 Istikbol Street, Tashkent",
    base_price: 110,
    status: "active",
    notes: "Higher-rate apartment for longer stays."
  },
  {
    id: "0f67ea44-d06d-4f1a-91ce-ae3017d1f004",
    title: "Airport Comfort Flat",
    address: "29 Yangi Sergeli Road, Tashkent",
    base_price: 70,
    status: "active",
    notes: "Frequent airport transit bookings."
  },
  {
    id: "0f67ea44-d06d-4f1a-91ce-ae3017d1f005",
    title: "Family Garden Suite",
    address: "88 Mirzo Ulugbek Avenue, Tashkent",
    base_price: 95,
    status: "inactive",
    notes: "Temporarily paused for minor renovation."
  }
];

const bookings: Database["public"]["Tables"]["bookings"]["Insert"][] = [
  {
    id: "18e29d67-d98f-4cd6-9f7d-3964ee0d1001",
    apartment_id: "0f67ea44-d06d-4f1a-91ce-ae3017d1f001",
    guest_name: "Sardor Ishmatov",
    guest_phone: "+998901112233",
    check_in: "2026-04-01",
    check_out: "2026-04-04",
    total_amount: 255,
    prepaid_amount: 255,
    payment_status: "paid",
    booking_status: "confirmed",
    notes: "Late arrival after 21:00."
  },
  {
    id: "18e29d67-d98f-4cd6-9f7d-3964ee0d1002",
    apartment_id: "0f67ea44-d06d-4f1a-91ce-ae3017d1f003",
    guest_name: "Madina Yusupova",
    guest_phone: "+998935556677",
    check_in: "2026-04-03",
    check_out: "2026-04-10",
    total_amount: 770,
    prepaid_amount: 300,
    payment_status: "partial",
    booking_status: "new",
    notes: "Needs airport transfer follow-up."
  },
  {
    id: "18e29d67-d98f-4cd6-9f7d-3964ee0d1003",
    apartment_id: "0f67ea44-d06d-4f1a-91ce-ae3017d1f004",
    guest_name: "Roman Petrov",
    guest_phone: null,
    check_in: "2026-03-29",
    check_out: "2026-03-31",
    total_amount: 140,
    prepaid_amount: 0,
    payment_status: "unpaid",
    booking_status: "confirmed",
    notes: "Pay on arrival."
  }
];

const expenses: Database["public"]["Tables"]["expenses"]["Insert"][] = [
  {
    id: "c4e3ce43-97da-4f3b-9a4b-f51655ff2001",
    apartment_id: "0f67ea44-d06d-4f1a-91ce-ae3017d1f001",
    amount: 18,
    category: "cleaning",
    expense_date: "2026-03-28",
    note: "Post-checkout cleaning."
  },
  {
    id: "c4e3ce43-97da-4f3b-9a4b-f51655ff2002",
    apartment_id: "0f67ea44-d06d-4f1a-91ce-ae3017d1f003",
    amount: 32,
    category: "utilities",
    expense_date: "2026-03-27",
    note: "Monthly electricity and water."
  },
  {
    id: "c4e3ce43-97da-4f3b-9a4b-f51655ff2003",
    apartment_id: "0f67ea44-d06d-4f1a-91ce-ae3017d1f005",
    amount: 95,
    category: "repair",
    expense_date: "2026-03-25",
    note: "Bathroom fixture replacement."
  }
];

const settings: Database["public"]["Tables"]["settings"]["Insert"] = {
  id: 1,
  business_name: "Sapphire Stay Management",
  currency: "USD",
  timezone: "Asia/Tashkent"
};

const supabase = createClient<Database>(supabaseUrl, requireServiceRoleKey(), {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function ensureUser(seedUser: SeedUser): Promise<string> {
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });
  const users = usersData?.users ?? [];

  if (listError) {
    throw listError;
  }

  const existing = users.find((user) => user.email === seedUser.email);

  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      email: seedUser.email,
      password: demoPassword,
      email_confirm: true,
      user_metadata: {
        full_name: seedUser.fullName
      }
    });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error(`Failed to update ${seedUser.email}`);
    }

    return data.user.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: seedUser.email,
    password: demoPassword,
    email_confirm: true,
    user_metadata: {
      full_name: seedUser.fullName
    }
  });

  if (error || !data.user) {
    throw error ?? new Error(`Failed to create ${seedUser.email}`);
  }

  return data.user.id;
}

async function main() {
  const seededUsers = await Promise.all(
    seedUsers.map(async (seedUser) => {
      const id = await ensureUser(seedUser);

      return {
        id,
        full_name: seedUser.fullName,
        email: seedUser.email,
        role: seedUser.role
      };
    })
  );

  const { error: userError } = await supabase.from("users").upsert(seededUsers);

  if (userError) {
    throw userError;
  }

  const { error: settingsError } = await supabase.from("settings").upsert(settings);

  if (settingsError) {
    throw settingsError;
  }

  const { error: apartmentError } = await supabase.from("apartments").upsert(apartments);

  if (apartmentError) {
    throw apartmentError;
  }

  const { error: bookingError } = await supabase.from("bookings").upsert(bookings);

  if (bookingError) {
    throw bookingError;
  }

  const { error: expenseError } = await supabase.from("expenses").upsert(expenses);

  if (expenseError) {
    throw expenseError;
  }

  console.log("Seed complete.");
  console.log(`Owner login: ${seedUsers[0].email} / ${demoPassword}`);
  console.log(`Member login: ${seedUsers[1].email} / ${demoPassword}`);
}

main().catch((error) => {
  console.error("Seed failed.");
  console.error(error);
  process.exitCode = 1;
});
