CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company TEXT NOT NULL,
  website TEXT,
  industry TEXT NOT NULL DEFAULT 'Other',
  employee_range TEXT NOT NULL DEFAULT '1-10',
  runs_paid_ads BOOLEAN NOT NULL DEFAULT false,
  publishes_video BOOLEAN NOT NULL DEFAULT false,
  in_house_team BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shared workspace can read leads" ON public.leads FOR SELECT USING (true);
CREATE POLICY "Shared workspace can insert leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Shared workspace can update leads" ON public.leads FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Shared workspace can delete leads" ON public.leads FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.leads (company, website, industry, employee_range, runs_paid_ads, publishes_video, in_house_team) VALUES
('Northbeam Creative', 'northbeamcreative.com', 'Agency', '11-50', true, true, true),
('Lumen & Loop', 'lumenandloop.com', 'E-commerce', '51-200', true, true, false),
('Cadence Studios', 'cadencestudios.tv', 'Media/Entertainment', '11-50', false, true, true),
('Riverstone Retail Group', 'riverstoneretail.com', 'E-commerce', '201-1000', true, false, true),
('Kettle & Co', 'kettleandco.io', 'SaaS', '11-50', true, false, false),
('Fairview Logistics', 'fairviewlogistics.com', 'Enterprise', '1000+', false, false, true),
('Brightpath Analytics', 'brightpathanalytics.com', 'SaaS', '1-10', false, false, false),
('Halo Social', 'halosocial.agency', 'Agency', '51-200', true, true, true);