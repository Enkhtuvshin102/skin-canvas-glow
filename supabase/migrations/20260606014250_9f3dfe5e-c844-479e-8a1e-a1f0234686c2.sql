-- Allow realtime subscriptions for postgres_changes on public listings (which is publicly readable)
CREATE POLICY "Allow realtime listings subscriptions"
ON realtime.messages
FOR SELECT
TO anon, authenticated
USING (true);