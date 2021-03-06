\c cp-users-development
UPDATE sys_user SET
  salt='6a43b460',
  pass='8d8537a931321e9c1fbcc493da36b09888338d4615341016498fd40926b7e115f77c8676f6c06e391415265688658f1d8380bc6f9b45cd33572479e04ec1246f';
UPDATE sys_user set email = 'testmail+user' || id || '@example.com';
UPDATE sys_user set nick = email;
UPDATE sys_user SET
  nick = 'NameyFace' ,
  name = 'Namey McNameFace' ,
  first_name = 'Namey' ,
  last_name = 'McNameFace' ,
  phone = translate(phone, '0123456789','9999999999');
TRUNCATE cd_oauth2;
UPDATE cd_profiles SET name = 'Namey McNameFace';
UPDATE cd_profiles SET email = 'testmail+user' || user_id || '@example.com';
UPDATE cd_profiles SET alias = 'NameyFace';
UPDATE cd_profiles SET avatar = NULL, parent_invites = NULL, ninja_invites = NULL, twitter = NULL, linkedin = NULL;
UPDATE sys_login SET email = 'testmail+user' || sys_login.user || '@example.com', token = NULL;
UPDATE sys_login SET nick = email;
UPDATE sys_reset SET nick = 'testmail+user' || sys_reset.user || '@example.com';
UPDATE cd_agreements SET full_name='Namey McNameFace', ip_address='127.0.0.1';

\c cp-dojos-development
UPDATE cd_dojoleads SET application = jsonb_set(application::jsonb, '{champion, email}'::text[], ('"testmail+user' || user_id || '@example.com"')::jsonb);
UPDATE cd_dojoleads SET application = jsonb_set(application::jsonb, '{champion, twitter}'::text[], '"example"');
UPDATE cd_dojoleads SET application = jsonb_set(application::jsonb, '{champion, firstName}'::text[], '"Namey"');
UPDATE cd_dojoleads SET application = jsonb_set(application::jsonb, '{champion, lastName}'::text[], '"McNameFace"');
UPDATE cd_dojoleads SET application = jsonb_set(application::jsonb, '{champion, dob}'::text[], '"1980-01-01T00:00:00.000Z"');
UPDATE cd_dojoleads SET application = jsonb_set(application::jsonb, '{champion, phone}'::text[], '"1234567890"');
UPDATE cd_dojoleads SET application = jsonb_set(application::jsonb, '{champion, linkedIn}'::text[], '"linkedIn"');
UPDATE cd_dojoleads SET application = jsonb_set(application::jsonb, '{charter, fullName}'::text[], '"Namey McNameFace"');
UPDATE cd_dojoleads SET email = 'testmail+user' || user_id || '@example.com';
UPDATE cd_dojos SET creator_email = 'testmail+user' || creator || '@example.com';
UPDATE cd_dojos SET user_invites = NULL;

\c cp-events-development
UPDATE cd_applications SET name = 'test' || user_id || 'user';
UPDATE cd_applications SET notes = 'Some notes about the application' WHERE notes != '';
