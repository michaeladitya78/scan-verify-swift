-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('officer', 'supervisor', 'admin');

-- Create user profiles table
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role app_role DEFAULT 'officer',
  department TEXT,
  badge_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number TEXT UNIQUE NOT NULL,
  model_number TEXT NOT NULL,
  hsn_code TEXT NOT NULL,
  product_description TEXT NOT NULL,
  declared_value DECIMAL(10,2),
  country_of_origin TEXT,
  brand TEXT,
  barcode TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX idx_serial_number ON public.products(serial_number);
CREATE INDEX idx_hsn_code ON public.products(hsn_code);

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create verification logs table
CREATE TABLE public.verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id),
  captured_image_url TEXT,
  ocr_raw_text TEXT,
  extracted_serial TEXT,
  extracted_hsn TEXT,
  verification_status TEXT CHECK (verification_status IN ('PASS', 'NO_PASS', 'MANUAL_REVIEW')),
  mismatch_reason TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on verification logs
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for verification images
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-images', 'verification-images', true);

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
ON public.user_profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- RLS Policies for products (all authenticated users can read)
CREATE POLICY "Authenticated users can view products"
ON public.products FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for verification_logs
CREATE POLICY "Users can view their own logs"
ON public.verification_logs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logs"
ON public.verification_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Storage policies for verification images
CREATE POLICY "Anyone can view verification images"
ON storage.objects FOR SELECT
USING (bucket_id = 'verification-images');

CREATE POLICY "Authenticated users can upload verification images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'verification-images');

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert sample products for testing
INSERT INTO public.products (serial_number, model_number, hsn_code, product_description, declared_value, country_of_origin, brand) VALUES
('F9GZC123XYZ', 'iPhone 15 Pro', '85171310', 'Apple iPhone 15 Pro 256GB Titanium', 999.00, 'China', 'Apple'),
('C38K2J891WE', 'Catalyst 2960-X', '85176290', 'Cisco Catalyst 2960-X Series Switch', 1250.00, 'USA', 'Cisco'),
('SM987N654QW', 'Galaxy S24', '85171310', 'Samsung Galaxy S24 Ultra 512GB', 1199.00, 'South Korea', 'Samsung'),
('DL456H789RT', 'Latitude 7420', '84713010', 'Dell Latitude 7420 Laptop', 1499.00, 'China', 'Dell'),
('HP234T567UI', 'EliteBook 840', '84713010', 'HP EliteBook 840 G9', 1399.00, 'China', 'HP'),
('LG789P123OP', 'OLED55C3', '85287120', 'LG 55 OLED C3 Series TV', 1799.00, 'South Korea', 'LG'),
('SN567M890AS', 'SoundLink Flex', '85182200', 'Bose SoundLink Flex Speaker', 149.00, 'China', 'Bose'),
('CP901L234KJ', 'AirPods Pro 2', '85183000', 'Apple AirPods Pro 2nd Gen', 249.00, 'Vietnam', 'Apple'),
('AM345K678HG', 'Echo Dot 5', '85182200', 'Amazon Echo Dot 5th Gen', 49.99, 'Malaysia', 'Amazon'),
('GO123J456FD', 'Hero 12 Black', '85258020', 'GoPro Hero 12 Black', 399.99, 'China', 'GoPro');