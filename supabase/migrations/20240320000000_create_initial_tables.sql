-- Create profiles table
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text,
    full_name text,
    balance decimal default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create market_data table
create table if not exists public.market_data (
    id uuid default gen_random_uuid() primary key,
    symbol text not null unique,
    name text not null,
    type text not null check (type in ('stock', 'mutual_fund', 'bond')),
    price decimal not null,
    change decimal default 0,
    risk_level text check (risk_level in ('LOW', 'MEDIUM', 'HIGH')),
    minimum_investment decimal default 0,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create investments table
create table if not exists public.investments (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users on delete cascade not null,
    symbol text references market_data(symbol) not null,
    type text not null check (type in ('stock', 'mutual_fund', 'bond')),
    quantity integer not null check (quantity > 0),
    purchase_price decimal not null,
    sold boolean default false,
    sold_at timestamp with time zone,
    sold_price decimal,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create payments table
create table if not exists public.payments (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users on delete cascade not null,
    amount decimal not null,
    status text not null check (status in ('pending', 'completed', 'failed')),
    payment_method text,
    transaction_id text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.profiles enable row level security;
alter table public.market_data enable row level security;
alter table public.investments enable row level security;
alter table public.payments enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone."
    on profiles for select
    using ( true );

create policy "Users can insert their own profile."
    on profiles for insert
    with check ( auth.uid() = id );

create policy "Users can update own profile."
    on profiles for update using ( auth.uid() = id );

-- Market data policies
create policy "Market data is viewable by everyone."
    on market_data for select
    using ( true );

-- Investments policies
create policy "Users can view own investments."
    on investments for select
    using ( auth.uid() = user_id );

create policy "Users can insert own investments."
    on investments for insert
    with check ( auth.uid() = user_id );

create policy "Users can update own investments."
    on investments for update
    using ( auth.uid() = user_id );

-- Payments policies
create policy "Users can view own payments."
    on payments for select
    using ( auth.uid() = user_id );

create policy "Users can insert own payments."
    on payments for insert
    with check ( auth.uid() = user_id );

-- Add some sample market data
insert into public.market_data (symbol, name, type, price, change, risk_level, minimum_investment, description)
values 
    ('AAPL', 'Apple Inc.', 'stock', 175.50, 2.3, 'MEDIUM', 100, 'Leading technology company'),
    ('GOOGL', 'Alphabet Inc.', 'stock', 140.25, 1.8, 'MEDIUM', 100, 'Technology and search giant'),
    ('HDFC', 'HDFC Bank', 'stock', 1450.75, -0.5, 'LOW', 500, 'Leading Indian bank'),
    ('AXIS', 'Axis Mutual Fund', 'mutual_fund', 45.20, 0.8, 'MEDIUM', 1000, 'Balanced mutual fund'),
    ('SBI', 'SBI Mutual Fund', 'mutual_fund', 32.15, 1.2, 'LOW', 1000, 'Large-cap mutual fund'),
    ('GOVT2030', 'Government Bond 2030', 'bond', 98.50, 0.3, 'LOW', 5000, '10-year government bond'),
    ('CORP2025', 'Corporate Bond 2025', 'bond', 99.75, 0.2, 'MEDIUM', 10000, '5-year corporate bond');