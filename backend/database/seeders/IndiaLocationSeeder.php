<?php

namespace Database\Seeders;

use App\Models\District;
use App\Models\State;
use Illuminate\Database\Seeder;

class IndiaLocationSeeder extends Seeder
{
    /**
     * All 28 states + 8 union territories with their districts.
     * District boundaries/names change periodically via state gazette
     * notifications, so this list should be revisited if that happens.
     *
     * @var array<int, array{name: string, code: string, districts: array<int, string>}>
     */
    private const STATES = [
        ['name' => 'Andhra Pradesh', 'code' => 'AP', 'districts' => [
            'Alluri Sitharama Raju', 'Anakapalli', 'Anantapur', 'Annamayya', 'Bapatla', 'Chittoor',
            'East Godavari', 'Eluru', 'Guntur', 'Kakinada', 'Konaseema', 'Krishna', 'Kurnool', 'Nandyal',
            'NTR', 'Palnadu', 'Parvathipuram Manyam', 'Prakasam', 'Srikakulam', 'Sri Sathya Sai', 'Tirupati',
            'Visakhapatnam', 'Vizianagaram', 'West Godavari', 'YSR Kadapa', 'Sri Potti Sriramulu Nellore',
        ]],
        ['name' => 'Arunachal Pradesh', 'code' => 'AR', 'districts' => [
            'Tawang', 'West Kameng', 'East Kameng', 'Pakke-Kessang', 'Papum Pare', 'Kurung Kumey',
            'Kra Daadi', 'Lower Subansiri', 'Upper Subansiri', 'Kamle', 'West Siang', 'Shi Yomi',
            'East Siang', 'Siang', 'Upper Siang', 'Lower Siang', 'Leparada', 'Lower Dibang Valley',
            'Dibang Valley', 'Anjaw', 'Lohit', 'Namsai', 'Changlang', 'Tirap', 'Longding',
        ]],
        ['name' => 'Assam', 'code' => 'AS', 'districts' => [
            'Baksa', 'Barpeta', 'Biswanath', 'Bongaigaon', 'Cachar', 'Charaideo', 'Chirang', 'Darrang',
            'Dhemaji', 'Dhubri', 'Dibrugarh', 'Dima Hasao', 'Goalpara', 'Golaghat', 'Hailakandi', 'Hojai',
            'Jorhat', 'Kamrup', 'Kamrup Metropolitan', 'Karbi Anglong', 'Karimganj', 'Kokrajhar',
            'Lakhimpur', 'Majuli', 'Morigaon', 'Nagaon', 'Nalbari', 'Sivasagar', 'Sonitpur',
            'South Salmara-Mankachar', 'Tinsukia', 'Udalguri', 'West Karbi Anglong', 'Bajali', 'Tamulpur',
        ]],
        ['name' => 'Bihar', 'code' => 'BR', 'districts' => [
            'Araria', 'Arwal', 'Aurangabad', 'Banka', 'Begusarai', 'Bhagalpur', 'Bhojpur', 'Buxar',
            'Darbhanga', 'East Champaran', 'Gaya', 'Gopalganj', 'Jamui', 'Jehanabad', 'Kaimur', 'Katihar',
            'Khagaria', 'Kishanganj', 'Lakhisarai', 'Madhepura', 'Madhubani', 'Munger', 'Muzaffarpur',
            'Nalanda', 'Nawada', 'Patna', 'Purnia', 'Rohtas', 'Saharsa', 'Samastipur', 'Saran',
            'Sheikhpura', 'Sheohar', 'Sitamarhi', 'Siwan', 'Supaul', 'Vaishali', 'West Champaran',
        ]],
        ['name' => 'Chhattisgarh', 'code' => 'CT', 'districts' => [
            'Balod', 'Baloda Bazar', 'Balrampur', 'Bastar', 'Bemetara', 'Bijapur', 'Bilaspur', 'Dantewada',
            'Dhamtari', 'Durg', 'Gariaband', 'Gaurela-Pendra-Marwahi', 'Janjgir-Champa', 'Jashpur',
            'Kabirdham', 'Kanker', 'Kondagaon', 'Korba', 'Koriya', 'Mahasamund', 'Mungeli', 'Narayanpur',
            'Raigarh', 'Raipur', 'Rajnandgaon', 'Sukma', 'Surajpur', 'Surguja',
            'Manendragarh-Chirmiri-Bharatpur', 'Mohla-Manpur-Ambagarh Chowki', 'Sarangarh-Bilaigarh',
            'Khairagarh-Chhuikhadan-Gandai', 'Sakti',
        ]],
        ['name' => 'Goa', 'code' => 'GA', 'districts' => ['North Goa', 'South Goa']],
        ['name' => 'Gujarat', 'code' => 'GJ', 'districts' => [
            'Ahmedabad', 'Amreli', 'Anand', 'Aravalli', 'Banaskantha', 'Bharuch', 'Bhavnagar', 'Botad',
            'Chhota Udaipur', 'Dahod', 'Dang', 'Devbhoomi Dwarka', 'Gandhinagar', 'Gir Somnath', 'Jamnagar',
            'Junagadh', 'Kheda', 'Kutch', 'Mahisagar', 'Mehsana', 'Morbi', 'Narmada', 'Navsari',
            'Panchmahal', 'Patan', 'Porbandar', 'Rajkot', 'Sabarkantha', 'Surat', 'Surendranagar', 'Tapi',
            'Vadodara', 'Valsad',
        ]],
        ['name' => 'Haryana', 'code' => 'HR', 'districts' => [
            'Ambala', 'Bhiwani', 'Charkhi Dadri', 'Faridabad', 'Fatehabad', 'Gurugram', 'Hisar', 'Jhajjar',
            'Jind', 'Kaithal', 'Karnal', 'Kurukshetra', 'Mahendragarh', 'Nuh', 'Palwal', 'Panchkula',
            'Panipat', 'Rewari', 'Rohtak', 'Sirsa', 'Sonipat', 'Yamunanagar',
        ]],
        ['name' => 'Himachal Pradesh', 'code' => 'HP', 'districts' => [
            'Bilaspur', 'Chamba', 'Hamirpur', 'Kangra', 'Kinnaur', 'Kullu', 'Lahaul and Spiti', 'Mandi',
            'Shimla', 'Sirmaur', 'Solan', 'Una',
        ]],
        ['name' => 'Jharkhand', 'code' => 'JH', 'districts' => [
            'Bokaro', 'Chatra', 'Deoghar', 'Dhanbad', 'Dumka', 'East Singhbhum', 'Garhwa', 'Giridih',
            'Godda', 'Gumla', 'Hazaribagh', 'Jamtara', 'Khunti', 'Koderma', 'Latehar', 'Lohardaga', 'Pakur',
            'Palamu', 'Ramgarh', 'Ranchi', 'Sahibganj', 'Saraikela Kharsawan', 'Simdega', 'West Singhbhum',
        ]],
        ['name' => 'Karnataka', 'code' => 'KA', 'districts' => [
            'Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban', 'Bidar',
            'Chamarajanagar', 'Chikballapur', 'Chikkamagaluru', 'Chitradurga', 'Dakshina Kannada',
            'Davanagere', 'Dharwad', 'Gadag', 'Hassan', 'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal',
            'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga', 'Tumakuru', 'Udupi',
            'Uttara Kannada', 'Vijayapura', 'Yadgir', 'Vijayanagara',
        ]],
        ['name' => 'Kerala', 'code' => 'KL', 'districts' => [
            'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam', 'Kottayam', 'Kozhikode',
            'Malappuram', 'Palakkad', 'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad',
        ]],
        ['name' => 'Madhya Pradesh', 'code' => 'MP', 'districts' => [
            'Agar Malwa', 'Alirajpur', 'Anuppur', 'Ashoknagar', 'Balaghat', 'Barwani', 'Betul', 'Bhind',
            'Bhopal', 'Burhanpur', 'Chhatarpur', 'Chhindwara', 'Damoh', 'Datia', 'Dewas', 'Dhar', 'Dindori',
            'Guna', 'Gwalior', 'Harda', 'Narmadapuram', 'Indore', 'Jabalpur', 'Jhabua', 'Katni', 'Khandwa',
            'Khargone', 'Mandla', 'Mandsaur', 'Morena', 'Narsinghpur', 'Neemuch', 'Niwari', 'Panna',
            'Raisen', 'Rajgarh', 'Ratlam', 'Rewa', 'Sagar', 'Satna', 'Sehore', 'Seoni', 'Shahdol',
            'Shajapur', 'Sheopur', 'Shivpuri', 'Sidhi', 'Singrauli', 'Tikamgarh', 'Ujjain', 'Umaria',
            'Vidisha', 'Maihar', 'Pandhurna',
        ]],
        ['name' => 'Maharashtra', 'code' => 'MH', 'districts' => [
            'Ahmednagar', 'Akola', 'Amravati', 'Chhatrapati Sambhajinagar', 'Beed', 'Bhandara', 'Buldhana',
            'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon', 'Jalna', 'Kolhapur',
            'Latur', 'Mumbai City', 'Mumbai Suburban', 'Nagpur', 'Nanded', 'Nandurbar', 'Nashik',
            'Dharashiv', 'Palghar', 'Parbhani', 'Pune', 'Raigad', 'Ratnagiri', 'Sangli', 'Satara',
            'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal',
        ]],
        ['name' => 'Manipur', 'code' => 'MN', 'districts' => [
            'Bishnupur', 'Chandel', 'Churachandpur', 'Imphal East', 'Imphal West', 'Jiribam', 'Kakching',
            'Kamjong', 'Kangpokpi', 'Noney', 'Pherzawl', 'Senapati', 'Tamenglong', 'Tengnoupal', 'Thoubal',
            'Ukhrul',
        ]],
        ['name' => 'Meghalaya', 'code' => 'ML', 'districts' => [
            'East Garo Hills', 'East Jaintia Hills', 'East Khasi Hills', 'Eastern West Khasi Hills',
            'North Garo Hills', 'Ri Bhoi', 'South Garo Hills', 'South West Garo Hills',
            'South West Khasi Hills', 'West Garo Hills', 'West Jaintia Hills', 'West Khasi Hills',
        ]],
        ['name' => 'Mizoram', 'code' => 'MZ', 'districts' => [
            'Aizawl', 'Champhai', 'Hnahthial', 'Khawzawl', 'Kolasib', 'Lawngtlai', 'Lunglei', 'Mamit',
            'Saiha', 'Saitual', 'Serchhip',
        ]],
        ['name' => 'Nagaland', 'code' => 'NL', 'districts' => [
            'Chumoukedima', 'Dimapur', 'Kiphire', 'Kohima', 'Longleng', 'Mokokchung', 'Mon', 'Niuland',
            'Noklak', 'Peren', 'Phek', 'Shamator', 'Tuensang', 'Tseminyu', 'Wokha', 'Zunheboto',
        ]],
        ['name' => 'Odisha', 'code' => 'OD', 'districts' => [
            'Angul', 'Balangir', 'Balasore', 'Bargarh', 'Bhadrak', 'Boudh', 'Cuttack', 'Deogarh',
            'Dhenkanal', 'Gajapati', 'Ganjam', 'Jagatsinghpur', 'Jajpur', 'Jharsuguda', 'Kalahandi',
            'Kandhamal', 'Kendrapara', 'Kendujhar', 'Khordha', 'Koraput', 'Malkangiri', 'Mayurbhanj',
            'Nabarangpur', 'Nayagarh', 'Nuapada', 'Puri', 'Rayagada', 'Sambalpur', 'Subarnapur',
            'Sundargarh',
        ]],
        ['name' => 'Punjab', 'code' => 'PB', 'districts' => [
            'Amritsar', 'Barnala', 'Bathinda', 'Faridkot', 'Fatehgarh Sahib', 'Fazilka', 'Ferozepur',
            'Gurdaspur', 'Hoshiarpur', 'Jalandhar', 'Kapurthala', 'Ludhiana', 'Malerkotla', 'Mansa', 'Moga',
            'Muktsar', 'Pathankot', 'Patiala', 'Rupnagar', 'Sahibzada Ajit Singh Nagar', 'Sangrur',
            'Shaheed Bhagat Singh Nagar', 'Tarn Taran',
        ]],
        ['name' => 'Rajasthan', 'code' => 'RJ', 'districts' => [
            'Ajmer', 'Alwar', 'Banswara', 'Baran', 'Barmer', 'Bharatpur', 'Bhilwara', 'Bikaner', 'Bundi',
            'Chittorgarh', 'Churu', 'Dausa', 'Dholpur', 'Dungarpur', 'Hanumangarh', 'Jaipur', 'Jaisalmer',
            'Jalore', 'Jhalawar', 'Jhunjhunu', 'Jodhpur', 'Karauli', 'Kota', 'Nagaur', 'Pali', 'Pratapgarh',
            'Rajsamand', 'Sawai Madhopur', 'Sikar', 'Sirohi', 'Sri Ganganagar', 'Tonk', 'Udaipur',
        ]],
        ['name' => 'Sikkim', 'code' => 'SK', 'districts' => [
            'East Sikkim', 'West Sikkim', 'North Sikkim', 'South Sikkim', 'Pakyong', 'Soreng',
        ]],
        ['name' => 'Tamil Nadu', 'code' => 'TN', 'districts' => [
            'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul',
            'Erode', 'Kallakurichi', 'Kanchipuram', 'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai',
            'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
            'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi', 'Thanjavur', 'Theni',
            'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 'Tirupathur', 'Tiruppur', 'Tiruvallur',
            'Tiruvannamalai', 'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar',
        ]],
        ['name' => 'Telangana', 'code' => 'TG', 'districts' => [
            'Adilabad', 'Bhadradri Kothagudem', 'Hyderabad', 'Jagtial', 'Jangaon',
            'Jayashankar Bhupalpally', 'Jogulamba Gadwal', 'Kamareddy', 'Karimnagar', 'Khammam',
            'Komaram Bheem Asifabad', 'Mahabubabad', 'Mahabubnagar', 'Mancherial', 'Medak',
            'Medchal-Malkajgiri', 'Mulugu', 'Nagarkurnool', 'Nalgonda', 'Narayanpet', 'Nirmal',
            'Nizamabad', 'Peddapalli', 'Rajanna Sircilla', 'Rangareddy', 'Sangareddy', 'Siddipet',
            'Suryapet', 'Vikarabad', 'Wanaparthy', 'Warangal', 'Hanumakonda', 'Yadadri Bhuvanagiri',
        ]],
        ['name' => 'Tripura', 'code' => 'TR', 'districts' => [
            'Dhalai', 'Gomati', 'Khowai', 'North Tripura', 'Sepahijala', 'South Tripura', 'Unakoti',
            'West Tripura',
        ]],
        ['name' => 'Uttar Pradesh', 'code' => 'UP', 'districts' => [
            'Agra', 'Aligarh', 'Ambedkar Nagar', 'Amethi', 'Amroha', 'Auraiya', 'Ayodhya', 'Azamgarh',
            'Baghpat', 'Bahraich', 'Ballia', 'Balrampur', 'Banda', 'Barabanki', 'Bareilly', 'Basti',
            'Bhadohi', 'Bijnor', 'Budaun', 'Bulandshahr', 'Chandauli', 'Chitrakoot', 'Deoria', 'Etah',
            'Etawah', 'Farrukhabad', 'Fatehpur', 'Firozabad', 'Gautam Buddha Nagar', 'Ghaziabad',
            'Ghazipur', 'Gonda', 'Gorakhpur', 'Hamirpur', 'Hapur', 'Hardoi', 'Hathras', 'Jalaun', 'Jaunpur',
            'Jhansi', 'Kannauj', 'Kanpur Dehat', 'Kanpur Nagar', 'Kasganj', 'Kaushambi', 'Kheri',
            'Kushinagar', 'Lalitpur', 'Lucknow', 'Maharajganj', 'Mahoba', 'Mainpuri', 'Mathura', 'Mau',
            'Meerut', 'Mirzapur', 'Moradabad', 'Muzaffarnagar', 'Pilibhit', 'Pratapgarh', 'Prayagraj',
            'Raebareli', 'Rampur', 'Saharanpur', 'Sambhal', 'Sant Kabir Nagar', 'Shahjahanpur', 'Shamli',
            'Shrawasti', 'Siddharthnagar', 'Sitapur', 'Sonbhadra', 'Sultanpur', 'Unnao', 'Varanasi',
        ]],
        ['name' => 'Uttarakhand', 'code' => 'UT', 'districts' => [
            'Almora', 'Bageshwar', 'Chamoli', 'Champawat', 'Dehradun', 'Haridwar', 'Nainital',
            'Pauri Garhwal', 'Pithoragarh', 'Rudraprayag', 'Tehri Garhwal', 'Udham Singh Nagar',
            'Uttarkashi',
        ]],
        ['name' => 'West Bengal', 'code' => 'WB', 'districts' => [
            'Alipurduar', 'Bankura', 'Birbhum', 'Cooch Behar', 'Dakshin Dinajpur', 'Darjeeling', 'Hooghly',
            'Howrah', 'Jalpaiguri', 'Jhargram', 'Kalimpong', 'Kolkata', 'Malda', 'Murshidabad', 'Nadia',
            'North 24 Parganas', 'Paschim Bardhaman', 'Paschim Medinipur', 'Purba Bardhaman',
            'Purba Medinipur', 'Purulia', 'South 24 Parganas', 'Uttar Dinajpur',
        ]],
        // Union Territories
        ['name' => 'Andaman and Nicobar Islands', 'code' => 'AN', 'districts' => [
            'Nicobar', 'North and Middle Andaman', 'South Andaman',
        ]],
        ['name' => 'Chandigarh', 'code' => 'CH', 'districts' => ['Chandigarh']],
        ['name' => 'Dadra and Nagar Haveli and Daman and Diu', 'code' => 'DH', 'districts' => [
            'Dadra and Nagar Haveli', 'Daman', 'Diu',
        ]],
        ['name' => 'Delhi', 'code' => 'DL', 'districts' => [
            'Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi', 'North East Delhi',
            'North West Delhi', 'Shahdara', 'South Delhi', 'South East Delhi', 'South West Delhi',
            'West Delhi',
        ]],
        ['name' => 'Jammu and Kashmir', 'code' => 'JK', 'districts' => [
            'Anantnag', 'Bandipora', 'Baramulla', 'Budgam', 'Doda', 'Ganderbal', 'Jammu', 'Kathua',
            'Kishtwar', 'Kulgam', 'Kupwara', 'Poonch', 'Pulwama', 'Rajouri', 'Ramban', 'Reasi', 'Samba',
            'Shopian', 'Srinagar', 'Udhampur',
        ]],
        ['name' => 'Ladakh', 'code' => 'LA', 'districts' => ['Kargil', 'Leh']],
        ['name' => 'Lakshadweep', 'code' => 'LD', 'districts' => ['Lakshadweep']],
        ['name' => 'Puducherry', 'code' => 'PY', 'districts' => ['Karaikal', 'Mahe', 'Puducherry', 'Yanam']],
    ];

    public function run(): void
    {
        foreach (self::STATES as $entry) {
            $state = State::updateOrCreate(
                ['code' => $entry['code']],
                ['name' => $entry['name']],
            );

            foreach ($entry['districts'] as $district) {
                District::firstOrCreate(['state_id' => $state->id, 'name' => $district]);
            }
        }
    }
}
