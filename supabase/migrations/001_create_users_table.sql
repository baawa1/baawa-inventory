-- Create users table for authentication and user management
CREATE SEQUENCE public.users_id_seq;

CREATE TABLE public.users (
    id INTEGER NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'STAFF' CHECK (role IN ('ADMIN', 'MANAGER', 'STAFF')),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    "lastLogin" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Create indexes
CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

-- Set sequence ownership
ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;

-- Add RLS policies if needed (optional)
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;
GRANT ALL ON SEQUENCE public.users_id_seq TO anon;
GRANT ALL ON SEQUENCE public.users_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.users_id_seq TO service_role;

-- Create trigger function for updatedAt if it doesn't exist
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$function$;

-- Add trigger for updatedAt
CREATE TRIGGER set_users_timestamp 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION trigger_set_updated_at();
