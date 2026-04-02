import { getAdminCountries } from '@/actions/admin/countries';
import AdminCountriesClient from '@/components/admin/AdminCountriesClient';

export default async function AdminCountriesPage() {
    const countries = await getAdminCountries();

    return <AdminCountriesClient initialCountries={countries} />;
}
