-- Schema for AI Email Responder App

-- Profiles table (extends the default auth.users table)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  business_name text,
  business_description text,
  subscription_tier text not null default 'free',
  monthly_responses_limit integer not null default 25,
  monthly_responses_used integer not null default 0,
  subscription_start_date timestamp with time zone,
  subscription_end_date timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Trigger to create a profile when a new user signs up
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Email history table
create table email_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  customer_email text not null,
  generated_response text not null,
  context_provided text,
  tone_requested text default 'professional',
  was_edited boolean default false,
  final_response text,
  created_at timestamp with time zone default now() not null,
  customer_email_subject text,
  customer_email_from text,
  tags text[]
);

-- Row Level Security for email_history
alter table email_history enable row level security;

create policy "Users can view their own email history"
  on email_history for select
  using (auth.uid() = user_id);
  
create policy "Users can insert their own email history"
  on email_history for insert
  with check (auth.uid() = user_id);
  
create policy "Users can update their own email history"
  on email_history for update
  using (auth.uid() = user_id);

-- Email templates table
create table email_templates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  template_name text not null,
  template_content text not null,
  category text,
  is_default boolean default false,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Row Level Security for email_templates
alter table email_templates enable row level security;

create policy "Users can view their own templates"
  on email_templates for select
  using (auth.uid() = user_id);
  
create policy "Users can insert their own templates"
  on email_templates for insert
  with check (auth.uid() = user_id);
  
create policy "Users can update their own templates"
  on email_templates for update
  using (auth.uid() = user_id);
  
create policy "Users can delete their own templates"
  on email_templates for delete
  using (auth.uid() = user_id);

-- Subscription tracking table
create table subscription_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  event_type text not null, -- 'subscription_started', 'subscription_renewed', 'subscription_cancelled', 'plan_changed'
  previous_tier text,
  new_tier text,
  amount_paid numeric(10,2),
  created_at timestamp with time zone default now() not null
);

-- Function to reset monthly usage at beginning of billing cycle
create or replace function reset_monthly_usage()
returns trigger as $$
begin
  update profiles
  set monthly_responses_used = 0
  where id = new.user_id and 
        (new.event_type = 'subscription_started' or new.event_type = 'subscription_renewed');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_subscription_event
  after insert on subscription_events
  for each row execute procedure reset_monthly_usage();

-- Usage analytics table
create table usage_analytics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  date date not null default current_date,
  emails_processed integer not null default 0,
  average_response_length integer,
  total_tokens_used integer,
  unique_customers integer
);

-- Row Level Security for analytics
alter table usage_analytics enable row level security;

create policy "Users can view their own analytics"
  on usage_analytics for select
  using (auth.uid() = user_id);
