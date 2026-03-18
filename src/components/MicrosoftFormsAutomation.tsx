import React, { useState, useRef } from 'react';
import { ParsedForm, QuestionType, FormItem } from '../types';
import { WeightedQuestionRenderer } from './WeightedQuestionRenderer';
import { Spinner } from './Spinner';
import { Play, Square, Sliders, RotateCcw, Shuffle, ArrowLeft, Sparkles, Zap, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { creditsApi, automationLogsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface MicrosoftFormsAutomationProps {
    form: ParsedForm;
    onBack: () => void;
}

interface LogEntry {
    id: number;
    status: 'success' | 'error' | 'info' | 'stopped';
    message: string;
    time: string;
}

const MALE_NAMES = [
    "Ravichandran", "Prasannakumar", "Revanthkumar", "Rajadurai", "Kavinesh", "Aravindan", "Anbumalar", "Keshwant", "Nidhesh", "Harinath", "Ilanchezhiyan", "Nishanth", "Adhavan", "Akshay", "Rakesh", "Elangovan", "Darshan", "Sharan", "Agamaran", "Madhavanraj", "Inbanathan", "Akathiyan", "Arunaachalam", "Aadhithya", "Saranraj", "Bhagavan", "Charuvik", "Devaananth", "Litesh", "Dhina", "Rajanathan", "Bharat", "Nilavan", "Dhilip", "Aariv", "Nirmalkumar", "Arvind", "Oviyan", "Lavanyan", "Mugilan", "Jeyan", "Tarun", "Lakshminarayan", "Aravath", "Boobalan", "Krithin", "Nalan", "Elumalai", "Madhesh", "Nithin", "Malaravan", "Aadhit", "Murali", "Balamurali", "Anandan", "Pritiv", "Elavarasan", "Dayanand", "Murugaraj", "Mathisoodan", "Karthik", "Ezhilvendhan", "Punithan", "Gokulnath", "Gopinath", "Rishikesh", "Ramesh", "Annamalai", "Haribaskar", "Pramodkumar", "Ravishankar", "Janakiraman", "Ainkaran", "Balaji", "Aarathiyan", "Jayaraman", "Anthuvan", "Aaruthiran", "Nandha", "Sanjeev", "Adhishwar", "Mani", "Nikhilan", "Nigilan", "Nihar", "Dayanithi", "Aathireyan", "Nibunraj", "Geethan", "Anantharaj", "Nagarajan", "Rishi", "Balamurugan", "Pradeepkumar", "Prithviraj", "Nithyanandam", "Naveenkumar", "Hemeshwar", "Haresh", "Kalaiarasan", "Aathimithran", "Pavithranraj", "Charunath", "Dharun", "Abayan", "Gnanasekar", "Ashokan", "Adhith", "Rathnamraj", "Elavarasan", "Vignesh", "Ravikiran", "Amalan", "Ananthanathan", "Pranav", "Devarajan", "Aruneshwaran", "Agilesh", "Kishoreraj", "Kamaleshraj", "Prathap", "Ramanathanraj", "Priyanraj", "Sathish", "Aathvikraj", "Kumaresan", "Nedumaran", "Agastya", "Rakshith", "Jivith", "Komagan", "Rishiraj", "Girishkumar", "Hiteshraj", "Arul", "Ineshwar", "Ruban", "Jeevan", "Nila", "Abhi", "Aakash", "Sarathi", "Akshathraj", "Karunakaran", "Pandiyan", "Dhineshraj", "Bhuvish", "Aarman", "Damu", "Krishnagopal", "Aatral", "Dananjeyan", "Devaprasad", "Anbu", "Elumalai", "Jothikumar", "Nithish", "Aathiraichelvan", "Manikandan", "Ilangkumaran", "Nareshkumar", "Muralidharan", "Jayaram", "Govind", "Jiva", "Keerthi", "Nibun", "Padmesh", "Ezhilvendan", "Purushothaman", "Magizhan", "Jaicharan", "Dhyanesh", "Saran", "Mahesh", "Rishwanth", "Amuthesh", "Prahallad", "Marudhu", "Ranjith", "Chezhian", "Karuna", "Ratnam", "Athiban", "Pratik", "Athavan", "Devabalan", "Jeyapandian", "Ashath", "Ganeshan", "Deivamani", "Advik", "Nedumaran", "Praveenkumar", "Dharshan", "Devith", "Cheran", "Ilakkiyan", "Chenthooran", "Dharanesh", "Ishaanraj", "Adhiran", "Edwin", "Madhav", "Janarthan", "Manishraj", "Dharshith", "Prithvi", "Lakshman", "Anushanth", "Manimaran", "Asmithan", "Bhalaji", "Bavanish", "Kanimoli", "Kalaiselvan", "Chokkalingam", "Duraiarasu", "Abineshraj", "Nalanthan", "Saravanan", "Saravana", "Chidambaram", "Arulalan", "Harivardhan", "Dharunraj", "Palani", "Baskaran", "Chidambaram", "Ezhil", "Prashanthkumar", "Dayalan", "Rajkumarraj", "Devadarsan", "Madhusudhan", "Aathisharman", "Athif", "Inesh", "Hemachandran", "Liyan", "Amaresan", "Nagulan", "Rishikeshraj", "Ravishankarraj", "Lavan", "Eeshwar", "Aadhipan", "Cheramaan", "Jaisankar", "Nithil", "Anbuchelvan", "Lingesh", "Sanjay", "Aathvik", "Nitinkumar", "Nithilarasan", "Nandhakumar", "Kannanraj", "Prashanth", "Kaviarasu", "Ilaiyaraaja", "Chellamani", "Ebinesar", "Selva", "Dhruv", "Appu", "Boobal", "Ishwar", "Jaiganesh", "Sachin", "Chithiran", "Gurunathan", "Elakkiyadasan", "Liyash", "Bavan", "Aruldoss", "Aatralarasan", "Rakshithkumar", "Bhashyam", "Dheivamani", "Nithishkumar", "Jeevaanandham", "Harshavardhan", "Amaran", "Gowthamraj", "Adalarasu", "Siddharth", "Devanathan", "Appunni", "Advaith", "Muthukrishnan", "Ponniyinselvan", "Keerthirajan", "Praveen", "Hrishikesh", "Manikandanraj", "Dhanush", "Nigilan", "Gokul", "Elil", "Malaravan", "Gokulan", "Jaisankar", "Mathavan", "Aathavan", "Cheliyan", "Lokeshraj", "Manas", "Nithya", "Elavarasu", "Anbumani", "Anbarasan", "Gururaj", "Raghukumar", "Arjunraj", "Sharvesh", "Abhijith", "Mithun", "Akshayan", "Eshwar", "Gauthamraj", "Keerthivardhan", "Dharan", "Inba", "Haridass", "Inian", "Dushanth", "Kannadasan", "Nidheshwar", "Nilavan", "Devarajan", "Priyan", "Lakshmanan", "Adithya", "Nilavarasu", "Kanishk", "Arunjith", "Madhukiran", "Hrithikraj", "Abhilash", "Balasubramani", "Ilampari", "Iniyan", "Rudhran", "Elangumaran", "Anishwar", "Parameshwar", "Dhinesh", "Mithunraj", "Kulasekaran", "Shiva", "Arvindkrishna", "Arulmozhi", "Murugan", "Kaviraj", "Natarajan", "Bashyam", "Jeyaram", "Arisuran", "Rajesh", "Eniyavan", "Bhavesh", "Keshwin", "Mouli", "Haran", "Haricharan", "Nirmal", "Santhosh", "Barathan", "Aswath", "Neelan", "Ilango", "Jeyakandan", "Aaranyen", "Elilmaran", "Aathidevan", "Dhivyanthan", "Arivunithi", "Karthikeyan", "Barathwaaj", "Ramachandhiran", "Anganan", "Idhayan", "Rohan", "Aasai", "Jeyamani", "Jeeva", "Abhinay", "Gurucharan", "Chandramohan", "Karuppiah", "Govindaraj", "Dhrish", "Ebi", "Chaaran", "Jivithan", "Nandhakumar", "Niranjanraj", "Athishwar", "Jeevithkumar", "Jayakumar", "Inbanathan", "Dhivyan", "Dakshany", "Jayasimman", "Lakshmikanth", "Arivu", "Deshikan", "Agni", "Nivenkumar", "Mathan", "Perarasu", "Shashank", "Gowtham", "Deepak", "Athirayan", "Divakar", "Krithikraj", "Ethiraj", "Anuvardhan", "Gurunath", "Suriya", "Aadhavan", "Barathraj", "Dharanitharan", "Krishnakumar", "Kalaimani", "Gajapathi", "Kavipriyan", "Kalaiselvan", "Gowrishankar", "Anto", "Koushik", "Pratikraj", "Hariram", "Agamudaiyan", "Aahan", "Hariram", "Nivash", "Abhijeet", "Gnanavel", "Kathiravan", "Jairam", "Ilaiyavan", "Pandiarajan", "Harish", "Amudhesh", "Neelan", "Manivannan", "Narendrakumar", "Aadhira", "Praneeth", "Ragav", "Padmeshwar", "Maran", "Ilakkiya", "Vishal", "Navinkumar", "Kalaimani", "Krish", "Harinam", "Kumaranathan", "Agaran", "Anbarasan", "Kumar", "Pugazhendhi", "Premkumar", "Janakiraman", "Athiran", "Ganeshamoorthy", "Jegan", "Kavish", "Agathiyan", "Ram", "Jagan", "Devaguru", "Mohanraj", "Easwar", "Athish", "Ajesh", "Niruban", "Kuralarasan", "Pranavraj", "Ramanathan", "Nishanthkumar", "Niteshraj", "Kulothungan", "Deepanwar", "Krishnan", "Sahas", "Balamani", "Manickam", "Sunil", "Jagannath", "Sanjai", "Prakashraj", "Janarthanan", "Sethu", "Ravikirankumar", "Azhagan", "Aryan", "Jayachandran", "Pramod", "Sudhakar", "Elilarasan", "Kathiravan", "Kannan", "Kathirvelan", "Bhadresh", "Naveen", "Kamal", "Jai", "Boopathiraj", "Jothiram", "Atharva", "Devakumar", "Hrishi", "Lavanyan", "Kumaran", "Hariprasad", "Rajasekaran", "Iniyaraj", "Mukund", "Magizhan", "Ayyanar", "Ragavraj", "Agam", "Naresh", "Elaiya", "Ganapathi", "Pradeep", "Alaguchelvan", "Arivunidhi", "Pravin", "Ganesh", "Dharanidharan", "Hrithick", "Ishaan", "Kathiresan", "Daaman", "Mayilsamy", "Niranjan", "Aadhav", "Chandran", "Senthil", "Ashwin", "Nakul", "Kabilan", "Chellakannu", "Kavitharan", "Kumaresan", "Aravind", "Dashwanth", "Pavithran", "Chidarth", "Barath", "Danushraj", "Dashwin", "Aadhavraj", "Athiran", "Kokulan", "Baskar", "Agilan", "Geethan", "Rajeshkumar", "Hariharan", "Parthibaraj", "Dheeranathan", "Arulmani", "Neelakandan", "Revanth", "Madhavan", "Bavithran", "Selvam", "Raghu", "Balan", "Bharth", "Deepan", "Aarush", "Hariprasath", "Ganapathiraman", "Raghuvaranraj", "Jithen", "Mohitkumar", "Mukundhan", "Kapilan", "Arivuselvan", "Karthikayan", "Alagarsamy", "Chezhiyan", "Aruthan", "Iravathan", "Arulnithi", "Nagulan", "Manimaran", "Danush", "Dakshan", "Kavinilavan", "Kavin", "Avinash", "Chandrababu", "Edvinraj", "Chandraraj", "Mahendran", "Dineshraj", "Dhanushkodi", "Ravichandranraj", "Punithanraj", "Chellan", "Girish", "Arunesh", "Ovian", "Kothandapani", "Akshith", "Gautharn", "Anirudhan", "Chinmayan", "Ranjithkumar", "Heshanth", "Arunthayan", "Pravinkumar", "Guhan", "Ezhilan", "Keshav", "Ajay", "Lakshmi", "Akshey", "Kuralarasan", "Jeyavel", "Dhruvan", "Rakshanraj", "Chinmay", "Arivarasan", "Harishankar", "Gautham", "Abhimanyu", "Aananthajith", "Sarvesh", "Manish", "Jayanand", "Harshan", "Hitesh", "Kanishkan", "Ilango", "Premkumarraj", "Lingeshwar", "Manaswin", "Eniyan", "Atshayan", "Jayanth", "Bilahari", "Nikhilan", "Aadhishwar", "Devadarshan", "Harshavardhan", "Koushikraj", "Imman", "Adhik", "Jothiram", "Advith", "Devidasan", "Devendran", "Kathir", "Amudhan", "Mathanraj", "Jayapal", "Devesh", "Ahilan", "Kirubakaran", "Ilanchezhian", "Jayaprakash", "Karuppasamy", "Duraimurugan", "Rakshan", "Aravind", "Jaisurya", "Kishore", "Nitin", "Pradhosh", "Jeyachandran", "Gurucharan", "Athidevan", "Prasanna", "Nagaraj", "Dinidharan", "Jayaprakash", "Gubendran", "Prahalladhan", "Raja", "Kavineshwar", "Muthuselvan", "Niruban", "Sathya", "Krishna", "Inba", "Dheena", "Anvith", "Aswathaman", "Jatin", "Devish", "Jaisurya", "Mayon", "Rahul", "Hemant", "Mohit", "Atshayan", "Mohan", "Abhiman", "Giridhar", "Kapileswar", "Samaran", "Parithi", "Harsha", "Ritesh", "Gajendran", "Manibalan", "Kailash", "Gokulkrishna", "Gurumoorthy", "Sudarshan", "Ekambaram", "Badresh", "Abey", "Chandraprakash", "Kavivarmann", "Saisharan", "Nethran", "Balamithran", "Manibalan", "Devan", "Deva", "Riteshkumar", "Devaraj", "Rajkumar", "Kailashnath", "Dhiyash", "Thaman", "Kaviselvan", "Raghavendran", "Abishek", "Guru", "Ashwanth", "Pugazh", "Kabilar", "Jaikishan", "Liteshraj", "Hanish", "Ponniyan", "Aanazhagan", "Jayakanthan", "Badri", "Bhuvan", "Barathkumar", "Haridass", "Ilangovan", "Muthukumaran", "Chithraichelvan", "Dharani", "Elanchezhiyan", "Aadhil", "Paramesh", "Nitesh", "Dheeran", "Bhaskarraj", "Kesavraj", "Alaguthambi", "Akhilan", "Dhivakar", "Dakshin", "Jayaraman", "Ekambaram", "Dinesh", "Aaridran", "Aari", "Oviyanathan", "Kayilan", "Muthuselvam", "Nandha", "Barani", "Bhuvaneshwar", "Ethiraj", "Iswar", "Abishanth", "Ahivanan", "Varun", "Perarasunathan", "Idhayathullah", "Manickavasagam", "Aaran", "Jeganath", "Dheekshith", "Mahalingam", "Pradhoshraj", "Elavarasu", "Neel", "Rameshraj", "Rathishkumar", "Dhibak", "Jayachandran", "Deepanraj", "Divyanth", "Rajasekaran", "Kadhiresan", "Madhu", "Kaviyan", "Boopalan", "Chokkalingam", "Kathirvelu", "Agarayan", "Sakthi", "Ezhilarasan", "Darshanraj", "Arumugam", "Karikalan", "Chellapandian", "Dhashwanth", "Mahendran", "Lakshmipathi", "Nivashraj", "Madheshwar", "Karunai", "Rithvik", "Boopathi", "Pritivraj", "Gunaaselan", "Gnanavelu", "Jaikumar", "Keerthivasan", "Narendran", "Karunakaran", "Parithimalar", "Kayilan", "Rishwanthraj", "Purushoth", "Kiran", "Gurubalan", "Chithanyan", "Muthu", "Rajan", "Aruljyothi", "Indrajith", "Aandavar", "Karikalan", "Prem", "Dheeraj", "Palaniraj", "Harimurugan", "Dheenadhayalan", "Nimalraj", "Gunalan", "Dhashwin", "Chandru", "Ezhilarasu", "Deveshwar", "Ramachandran", "Kalairaj", "Akshath", "Parthiban", "Manojkumar", "Dilip", "Lokesh", "Rahulraj", "Natarajan", "Prasadraj", "Hemanthkumar", "Bhargav", "Sambath", "Jothimanickam", "Mugilarasan", "Janush", "Guhanathan", "Charun", "Arulmoli", "Aahanyan", "Nimalan", "Amudhanathan", "Azhagar", "Aadhimithran", "Sakthivel", "Manoj", "Nakulan", "Rakeshkumar", "Kalai", "Athvith", "Eashwaran", "Kalaichelvan", "Mathi", "Gowrishankar", "Arun", "Gururajan", "Adhuman", "Gayan", "Akilan", "Arulnambi", "Sabari", "Elango", "Maheshwaran", "Azhagunithi", "Jayamurugan", "Maranraj", "Jithu", "Kasiviswanathan", "Prathapraj", "Mathavan", "Anish", "Shravan", "Gunasekaran", "Gowrikar", "Kamalesh", "Nithilan", "Ayyappan", "Prasad", "Chellapandian", "Krishivraj", "Gurumoorthy", "Arjun", "Ahilanathan", "Anumithran", "Rithvikraj", "Roshan", "Harivignesh", "Gurubaran", "Aagash", "Annamalai", "Gagan", "Komagan", "Alagan", "Heshwin", "Eshwarraj", "Gopinath", "Ilaiya", "Arunprakash", "Kasirajan", "Anbuchelvan", "Cheranraj", "Janahan", "Dhilipkumar", "Krithik", "Jayaguru", "Aadhiran", "Niven", "Ajit", "Hari", "Navin", "Gajapathi", "Anirudh", "Balasuriya", "Gaven", "Avinashraj", "Anush", "Indrajith", "Moulishwar", "Raghuvaran", "Saman", "Abinesh", "Dharanidharan", "Abhisaran", "Mayan", "Dilipan", "Anand", "Gnanamani", "Niharraj", "Hemesh", "Sai", "Agneesh", "Ezhilmaran", "Gurudev", "Arunkumar", "Dushyanth", "Aswanth", "Praneethkumar", "Rohith", "Arush", "Iyappan", "Dhyan", "Rathish", "Rajadurai", "Jagdish", "Devaprasanth", "Durai", "Giridharan", "Prakash", "Amutharasan", "Iyappanraj", "Guruprakash", "Janahan", "Ganeshkumar", "Kumareshraj", "Chanakyan", "Marudhan", "Jaidev", "Nethran", "Javeesh", "Raghavan", "Aadhidev", "Bhuvanesh", "Abhinav", "Aadvikraj", "Ilampari", "Durairaj"
];

const FEMALE_NAMES = [
    "Charusree", "Jeyanthi", "Janaki", "Dhanya", "Hasini", "Meera", "Sumathi", "Kavika", "Nithyasree", "Idhaya", "Lipika", "Kala", "Indira", "Ishika", "Poonam", "Sujatha", "Haritha", "Jnanika", "Amutha", "Iraivi", "Maanasa", "Bhavadhaarini", "Chandrika", "Isaimani", "Ashwika", "Ezhilovya", "Madhura", "Nethra", "Mohana", "Sathyaabama", "Elakiya", "Gokila", "Ashna", "Pavithra", "Anupriya", "Barkavi", "Kalaichudar", "Jashvika", "Gajalila", "Aaral", "Sneha", "Ezhilarasi", "Rishika", "Grishma", "Charu", "Padmavathy", "Abhirami", "Nithika", "Jayani", "Ilakkiya", "Bavana", "Rupini", "Hrithika", "Meru", "Inbarasi", "Amara", "Anushya", "Janushri", "Spandana", "Kanishka", "Jhanvi", "Chinmayi", "Geetha", "Aara", "Arulselvi", "Anushree", "Nila", "Mythili", "Rakshaya", "Ezhinovia", "Rakshana", "Ilavanchi", "Prathiba", "Kamatchi", "Charulatha", "Athira", "Aswathi", "Sravya", "Bhumika", "Ahiri", "Aadhirai", "Dhivya", "Shifana", "Lisha", "Devaki", "Jeevajothi", "Eviya", "Sudharsini", "Kala", "Dalini", "Barkavi", "Kanmani", "Kanya", "Shruthi", "Kanimozhi", "Hiranya", "Kanimathi", "Aarathya", "Dhanu", "Amanya", "Dharshini", "Meghala", "Kamali", "Dhananya", "Kanishka", "Hiral", "Srinidhi", "Ramya", "Ashvatha", "Bavithra", "Chellamma", "Srimathi", "Sanvi", "Kumudha", "Sudharshana", "Jiya", "Amudhini", "Jeevitha", "Avani", "Meena", "Harini", "Jeyashree", "Sumitra", "Ashvitha", "Sujitha", "Agneya", "Gowshika", "Narmadha", "Monisha", "Appu", "Anbarasi", "Charumathi", "Dheekshitha", "Arunthathi", "Ekadhani", "Avantika", "Sarojini", "Kayal", "Shreenidhi", "Shree", "Bhuvana", "Dhunisha", "Adhira", "Devanayagi", "Nidhi", "Jony", "Bhavanya", "Leela", "Indhumathi", "Aamuktha", "Mayuri", "Agrima", "Avani", "Dakshina", "Elampirai", "Neha", "Swathi", "Deepika", "Nilavazhagi", "Archana", "Sahana", "Heshika", "Jeevika", "Alagumathi", "Magizhi", "Ineshika", "Eshwari", "Subiksha", "Ashwini", "Dharanika", "Anamika", "Meenakshi", "Malavika", "Raveena", "Rakshitha", "Anvitha", "Jenani", "Neeraja", "Avni", "Angala", "Shilpa", "Aananya", "Gathika", "Jeyam", "Anathi", "Shravey", "Jayanthi", "Alagu", "Jayany", "Dakshita", "Hemini", "Eviya", "Malarvizhi", "Mani", "Deshika", "Prasanna", "Hemamalin", "Keerthana", "Devaki", "Iyalnila", "Alagana", "Dhanalakshmi", "Bhuvi", "Ranjitha", "Gouri", "Amirthavarshini", "Prerana", "Srisha", "Dhanyasree", "Devatha", "Bhavitha", "Kanaka", "Harshitha", "Aradhana", "Jeyalakshmi", "Sailaja", "Gnanakumari", "Amuki", "Niranjana", "Mridula", "Amudha", "Iraniya", "Pranathi", "Anavi", "Devapriya", "Ithika", "Dheenika", "Aathmika", "Adharshana", "Mithra", "Shenbagam", "Akshita", "Bavanisha", "Aaradhya", "Punitha", "Jothirmayi", "Chaitra", "Jeya", "Shubha", "Subhashini", "Nalini", "Jashitha", "Riddhi", "Dhivya", "Haripriya", "Choreshwari", "Harshada", "Jenisha", "Arivunila", "Abhinaya", "Madhavi", "Sunanda", "Lakshitha", "Dharshana", "Amudini", "Dhivyadharshini", "Iyal", "Surekha", "Priyanka", "Karuna", "Ipsha", "Beryl", "Gajalakshmi", "Deepika", "Aakalya", "Bala", "Danushree", "Aahna", "Shravani", "Deepasree", "Bhavasri", "Sharmila", "Avinashini", "Amarni", "Elilarasi", "Jeevana", "Chitra", "Akshaya", "Dhritika", "Jalaja", "Janshika", "Manasi", "Mahalakshmi", "Bilahari", "Anuradha", "Padma", "Deekshitha", "Bhavana", "Kalaimagal", "Sunitha", "Iyali", "Keerthika", "Sasirekha", "Shyamala", "Ashmitha", "Jeya", "Sathana", "Haritha", "Kadambari", "Balambika", "Janhavi", "Bhuvaneshwari", "Charumathi", "Aganya", "Anitha", "Ezhilarasi", "Lika", "Agna", "Anbuchelvi", "Ilampirai", "Ashvini", "Dakshana", "Devadarshini", "Athulya", "Kavinaya", "Neelambari", "Azhagi", "Sivani", "Hitesha", "Isiri", "Ilavanjhi", "Akshika", "Poorna", "Deepalakshmi", "Suvetha", "Naadiya", "Ilampoorani", "Chella", "Lavanya", "Iniyaval", "Ishanya", "Alamelu", "Jaisree", "Iniyaval", "Hoshika", "Suhashini", "Manasa", "Karunya", "Kanya", "Dhaksha", "Jothisree", "Revathi", "Aruni", "Sruthi", "Kamaleshwari", "Ayushi", "Ineya", "Sharmi", "Anugraha", "Surabhi", "Kamitha", "Nadhira", "Ishita", "Darshana", "Megna", "Bhargavi", "Aganya", "Inbarasi", "Githa", "Kathambari", "Jhanvi", "Nimisha", "Anya", "Chandra", "Jyothika", "Sindhu", "Saritha", "Bhumika", "Aadhishree", "Kamali", "Sharmitha", "Selvi", "Maithili", "Bhavini", "Nirupama", "Janishka", "Bavatharani", "Ahalya", "Sivagami", "Dharshini", "Anjali", "Shivani", "Jenitha", "Jyotsna", "Ival", "Avanya", "Chaitra", "Suganya", "Adithi", "Gnanam", "Sahithya", "Lakshana", "Atshaya", "Dhanushree", "Aaleya", "Santhiya", "Sreekala", "Hema", "Nirmala", "Ishwarya", "Indrani", "Bhairevi", "Durga", "Bindhu", "Chinmayi", "Ayana", "Rashmi", "Kallarani", "Bhuvaneshwari", "Antara", "Athika", "Anaika", "Eshani", "Girija", "Rathika", "Inshika", "Abithira", "Amari", "Radha", "Poovarasi", "Gagana", "Hemitha", "Kalaiwani", "Abirami", "Janushree", "Mangai", "Adhiya", "Anuvidha", "Ithaya", "Anamika", "Aparna", "Aaridhya", "Gagana", "Amritha", "Ayana", "Sarika", "Abhinivesha", "Subhalakshmi", "Archana", "Sathya", "Indhupriya", "Isaivani", "Seetha", "Idhaya", "Greeshma", "Dhenuka", "Charani", "Sobia", "Pragathi", "Ezhil", "Aridra", "Nisha", "Hansini", "Harisree", "Garima", "Oviya", "Chitrani", "Alari", "Prathiksha", "Saranya", "Arthi", "Anupama", "Shrutika", "Arivumani", "Bhagya", "Alisha", "Bhavya", "Eniya", "Dhivyadharshini", "Rupa", "Ekanta", "Santhini", "Janani", "Ishani", "Ilakkiya", "Aathvika", "Dhaksheshwari", "Chaarvi", "Dharanya", "Athulya", "Kalpitha", "Jaganya", "Shakthi", "Kamini", "Deepthi", "Jasvitha", "Charulatha", "Arushi", "Geethika", "Durga", "Amuthini", "Kavini", "Aswathi", "Aahanya", "Aaradhana", "Jayalakshmi", "Annapoorani", "Manjari", "Sashti", "Sanjita", "Ambika", "Gunavathy", "Elakkiya", "Arunima", "Swetha", "Hemani", "Eshani", "Amudha", "Hridaya", "Dheena", "Aaritha", "Pooja", "Gurupriya", "Akshaya", "Sheela", "Manimegalai", "Jowshika", "Sushmitha", "Hemapriya", "Bavani", "Jyotsna", "Nandhini", "Geethanjali", "Kanjani", "Tamizh", "Gnanasri", "Ishana", "Adhvikha", "Gita", "Sanjana", "Anuvardhini", "Dhakshana", "Chaitanya", "Advika", "Punya", "Somya", "Semmalar", "Magathi", "Iyali", "Balasree", "Ilavarasi", "Banumathi", "Madhu", "Deivani", "Akshita", "Dharshana", "Akalvika", "Damayanthi", "Shalini", "Anjika", "Samanya", "Charunila", "Isai", "Ganeshwari", "Elina", "Ahila", "Bharkavi", "Geethalakshmi", "Manju", "Darshini", "Amala", "Anitha", "Amshini", "Amrutha", "Gowri", "Anishka", "Abhisri", "Advika", "Yazhmozhi", "Aashini", "Ashwanthi", "Kayalvizhi", "Dhanya", "Sivaranjani", "Ishani", "Janani", "Iniya", "Gajanani", "Chezhiya", "Isharya", "Janany", "Sabari", "Supriya", "Gowri", "Kanimozhi", "Mallika", "Surya", "Krithika", "Anjana", "Nivetha", "Prisha", "Indira", "Shaini", "Janisha", "Diyasree", "Aditi", "Aadhavi", "Hiyashree", "Anunidhi", "Dhanalakshmi", "Preethi", "Bavani", "Aaravi", "Harshana", "Mullai", "Chitra", "Sandhya", "Bhavika", "Ilanagai", "Ishana", "Ananya", "Aarna", "Mukthi", "Shreemathi", "Gilda", "Chithralekha", "Gayathri", "Diya", "Iniya", "Ananya", "Dhriti", "Anika", "Alagammai", "Shashini", "Sushma", "Gargi", "Sasikala", "Kalpana", "Sayana", "Aadhira", "Bharani", "Dakshatha", "Suchitra", "Athira", "Kadambari", "Anjana", "Eshana", "Karuna", "Bhuvana", "Devatha", "Girija", "Aadhavi", "Initha", "Srinika", "Mathangi", "Devasree", "Rohini", "Manonmani", "Dhruthi", "Deepa", "Bharathi", "Aarudhra", "Dhurga", "Charani", "Sree", "Ayini", "Nithya", "Samyuktha", "Ganavi", "Bhavani", "Kushali", "Hyndhavi", "Hemalatha", "Kavia", "Deepadharshini", "Sowmya", "Angayar", "Sakthi", "Darani", "Prema", "Reshma", "Inima", "Gowsalya", "Neela", "Rathna", "Bavithra", "Abira", "Menaka", "Gunalatha", "Bhadra", "Mownika", "Ashwina", "Lokeshwari", "Anusha", "Jeyadharshini", "Shanthi", "Hasrika", "Bavisha", "Monishree", "Pavithrasree", "Aadshaya", "Sindhuja", "Komathi", "Dharani", "Aiswarya", "Indhu", "Madhumitha", "Kadhambari", "Geethika", "Rishmitha", "Suvarna", "Aakalya", "Chandini", "Aamani", "Janyasri", "Rukmani", "Rubika", "Nandhana", "Dhurvashini", "Naveena", "Agila", "Deshika", "Kanmani", "Sharu", "Logitha", "Aruna", "Sukanya", "Brindha", "Ishwarya", "Bavisha", "Deepshika", "Raagini", "Poornima", "Kalavathi", "Savitha", "Tamilarasi", "Kannagi", "Sharanya", "Banu", "Aathvika", "Hemavathy", "Amanya", "Jaganmayi", "Anbumalar", "Jshitha", "Ishika", "Anumathi", "Keerthi", "Gulika", "Sudha", "Manjusree", "Aaradhna", "Dheeksha", "Arishree", "Kaniwari", "Roshini", "Avanthika", "Aanandhi", "Harika", "Diya", "Aritha", "Rubini", "Chellam", "Navaneetha", "Jivitha", "Ezhilmangai", "Aarthika", "Dhivyashree", "Navya", "Amutha", "Roja", "Dharani", "Eniyaval", "Nilani", "Dhwani", "Malathi", "Indhumathi", "Rithika", "Devayani", "Nirosha", "Charu", "Jyothi", "Ashini", "Jothi", "Jeeva", "Hridaya", "Geetha", "Kruthika", "Eksha", "Iraimathi", "Anushree", "Kalaiselvi", "Sai", "Humshika", "Easwari", "Devi", "Mathivathani", "Pragya", "Chakrika", "Janany", "Hitesha", "Harshini", "Shwetha", "Sadhana", "Pavalam", "Aarini", "Kavisri", "Azhagu", "Gopika", "Dayana", "Isana", "Aathini", "Bhairavi", "Radhika", "Aruna", "Sakshi", "Ira", "Swarna", "Bhavani", "Ezhilmalar", "Kamudha", "Anvitha", "Aanya", "Gauthami", "Shailaja", "Gunavathy", "Kiruba", "Brindha", "Dheepthi", "Hemavathy", "Angai", "Hasini", "Iniyavan", "Nishanthi", "Eshwari", "Amirthini", "Elavarasi", "Deepana", "Aathmika", "Namitha", "Niharika", "Gini", "Deepti", "Jeyapratha", "Aarathi", "Ishanika", "Agamya", "Prarthana", "Dushani", "Kundhavi", "Mithila", "Deepa", "Geethanjali", "Bhavana", "Dheekshanya", "Eshita", "Charuvi", "Muthu", "Kavya", "Lakshmi", "Heera", "Sreemathi", "Madhushree", "Harini", "Kavi", "Reva", "Arivazhagi", "Ezhilmulla", "Akshara", "Jeyasree", "Ipshika", "Elavarasi", "Sapna", "Inba", "Mukuntha", "Aradhya", "Sangeetha", "Ipitha", "Amutha", "Jothi", "Hemadharshini", "Amirdha", "Ahana", "Nagalakshmi", "Anjali", "Hemashree", "Aghanya", "Adishree", "Gayathri", "Anbarasi", "Azhagi", "Elili", "Aarunidhi", "Indu", "Abhinaya", "Kasthuri", "Anupama", "Ezhil", "Anishka", "Eshanya", "Kannagi", "Jothika", "Banu", "Nakshatra", "Mudra", "Nivethitha", "Kalaiarasi", "Jeeva", "Anmulla", "Sunidha", "Draupadi", "Senbagam", "Rashmika", "Inshika", "Ithika", "Anika", "Manisha", "Aarushi", "Akshatha", "Abhi", "Avanthini", "Dhanu", "Kanyashree", "Gokila", "Arathi", "Harshree", "Dhithya", "Abhigna", "Maheswari", "Dhanika", "Athmika", "Sridevi", "Harshitha", "Nivi", "Gomathi", "Jayapriya", "Heshika", "Dhanushya", "Panimalar", "Padmapriya", "Arundhathi", "Jenani", "Kamatchi", "Rithu", "Jayani", "Ivana", "Agalya", "Abaya", "Aashika", "Isiri", "Janyasri", "Kaviya", "Anya", "Gamya", "Adhithri", "Ishita", "Lekha", "Harshini", "Kalaiselvi", "Samanvi", "Subha", "Hruthika", "Ashika", "Anjalai", "Chamundeswari", "Dwaraka", "Dheepshika", "Kalpana", "Gomathi", "Bhagya", "Deepam", "Aaryahi", "Dhanasree", "Geethasree", "Agalya", "Shamili", "Beena", "Ashika", "Janu", "Maya", "Aparna", "Mouli", "Chandana", "Inika", "Dwaraka", "Malar", "Rakshita", "Inba", "Adhithi", "Hemalatha", "Chandini", "Adhvika", "Sobana", "Haripriya", "Jayasree", "Bhavatha", "Ashmitha", "Kalaimani", "Jayanthi", "Daamini", "Kaniya", "Dhivyasree", "Bhavya", "Nayana", "Manjula", "Ranjani", "Cheranila", "Deva", "Abhimathi", "Jeevitha"
];

// --- HELPER FUNCTIONS ---

const getInitialWeights = (items: FormItem[]) => {
    const w: Record<string, any> = {};
    items.forEach(item => {
        if (item.type === QuestionType.MULTIPLE_CHOICE || item.type === QuestionType.DROPDOWN) {
            if (item.options && item.options.length > 0) {
                const share = 100 / item.options.length;
                const iw: Record<string, number> = {};
                item.options.forEach(o => iw[o.id || o.label] = share);
                w[item.id] = iw;
            }
        } else if (item.type === QuestionType.CHECKBOXES) {
            if (item.options && item.options.length > 0) {
                const iw: Record<string, number> = {};
                item.options.forEach(o => iw[o.id || o.label] = 50);
                w[item.id] = iw;
            }
        } else if (item.type === QuestionType.LINEAR_SCALE) {
            const start = item.scaleStart || 1;
            const end = item.scaleEnd || 5;
            const range = Array.from({ length: end - start + 1 }, (_, i) => start + i);
            const share = 100 / range.length;
            const iw: Record<string, number> = {};
            range.forEach(v => iw[v.toString()] = share);
            w[item.id] = iw;
        }
    });
    return w;
};

const getInitialGridConfigs = (items: FormItem[]) => {
    const c: Record<string, boolean> = {};
    items.forEach(item => {
        if (item.type === QuestionType.MULTIPLE_CHOICE_GRID) {
            c[item.id] = !!item.limitOneResponsePerColumn;
        }
    });
    return c;
};

// --- BATCH GENERATION LOGIC ---

const generateBatchForSingleChoice = (
    total: number,
    weights: Record<string, number>
): string[] => {
    if (!weights) return Array(total).fill("");
    let planned: string[] = [];
    const entries = Object.entries(weights);
    entries.forEach(([label, w]) => {
        const count = Math.floor((w / 100) * total);
        for (let i = 0; i < count; i++) planned.push(label);
    });
    const sortedByWeight = entries.sort((a, b) => b[1] - a[1]);
    const fallback = sortedByWeight.length > 0 ? sortedByWeight[0][0] : "N/A";
    while (planned.length < total) {
        planned.push(fallback);
    }
    return planned.sort(() => Math.random() - 0.5);
};

const generateBatchForCheckboxes = (
    total: number,
    weights: Record<string, number>
): string[][] => {
    if (!weights) return Array.from({ length: total }, () => []);
    const batch: string[][] = Array.from({ length: total }, () => []);
    Object.entries(weights).forEach(([label, w]) => {
        const count = Math.floor((w / 100) * total);
        const optionOccurrence = Array(total).fill(false);
        for (let i = 0; i < count; i++) optionOccurrence[i] = true;
        optionOccurrence.sort(() => Math.random() - 0.5);
        optionOccurrence.forEach((isSelected: boolean, idx: number) => {
            if (isSelected && batch[idx]) {
                batch[idx].push(label);
            }
        });
    });
    return batch;
};

// --- COMPONENT ---

export const MicrosoftFormsAutomation: React.FC<MicrosoftFormsAutomationProps> = ({ form, onBack }) => {
    const { user, refreshCredits } = useAuth();
    const [weights, setWeights] = useState<Record<string, any>>(() => getInitialWeights(form.items));
    const [gridConfigs, setGridConfigs] = useState<Record<string, boolean>>(() => getInitialGridConfigs(form.items));

    const [specialModes, setSpecialModes] = useState<Record<string, 'GENDER' | 'NAME' | undefined>>({});

    const [targetCount, setTargetCount] = useState(10);
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [progress, setProgress] = useState(0);

    const stopRequested = useRef(false);
    const logCounter = useRef(0);

    const addLog = (status: 'success' | 'error' | 'info' | 'stopped', message: string) => {
        logCounter.current++;
        const id = logCounter.current;
        setLogs(prev => [{ id, status, message, time: new Date().toLocaleTimeString() }, ...prev]);
        return id;
    };

    const generateGridResponse = (item: FormItem) => {
        const result: Record<string, string> = {};
        if (!item.rows || !item.columns) return result;
        const colLabels = item.columns.map(c => c.label);
        const limitOne = gridConfigs[item.id] || false;
        if (limitOne && item.type === QuestionType.MULTIPLE_CHOICE_GRID) {
            const shuffled = [...colLabels].sort(() => Math.random() - 0.5);
            item.rows.forEach((row, idx) => {
                if (row.id && idx < shuffled.length) {
                    result[row.id] = shuffled[idx];
                }
            });
        } else {
            item.rows.forEach(row => {
                if (row.id) {
                    result[row.id] = colLabels[Math.floor(Math.random() * colLabels.length)];
                }
            });
        }
        return result;
    };

    const handleStart = async () => {
        if (isRunning || !form.actionUrl) {
            if (!form.actionUrl) alert("Action URL missing.");
            return;
        }
        setIsRunning(true);
        stopRequested.current = false;
        setLogs([]);
        setProgress(0);
        logCounter.current = 0;
        addLog('info', "Initializing automation engine...");
        await new Promise(resolve => setTimeout(resolve, 800));

        // Log this automation batch to Google Sheets
        try {
            await automationLogsApi.log(targetCount);
        } catch (e) {
            // Non-blocking — don't halt automation if logging fails
        }

        let successCount = 0;
        let pendingDeductions = 0;

        const batchSchedule: Record<string, any[]> = {};
        const genderItem = form.items.find(i => specialModes[i.id] === 'GENDER');
        const nameItem = form.items.find(i => specialModes[i.id] === 'NAME');

        if (genderItem && nameItem && weights[genderItem.id]) {
            const genderBatch = generateBatchForSingleChoice(targetCount, weights[genderItem.id]);
            batchSchedule[genderItem.id] = genderBatch;
            batchSchedule[nameItem.id] = genderBatch.map(genderVal => {
                const lower = genderVal.toLowerCase();
                if (lower.includes('female')) {
                    return FEMALE_NAMES[Math.floor(Math.random() * FEMALE_NAMES.length)];
                } else if (lower.includes('male')) {
                    return MALE_NAMES[Math.floor(Math.random() * MALE_NAMES.length)];
                } else {
                    return "N/A";
                }
            });
        }

        form.items.forEach(item => {
            if (batchSchedule[item.id]) return;
            if (item.type === QuestionType.SHORT_ANSWER || item.type === QuestionType.PARAGRAPH) {
                if (item.type === QuestionType.SHORT_ANSWER && specialModes[item.id] === 'NAME') {
                    const maleCount = Math.floor(targetCount * 0.6);
                    const femaleCount = targetCount - maleCount;
                    const names: string[] = [];
                    for (let k = 0; k < maleCount; k++) names.push(MALE_NAMES[Math.floor(Math.random() * MALE_NAMES.length)]);
                    for (let k = 0; k < femaleCount; k++) names.push(FEMALE_NAMES[Math.floor(Math.random() * FEMALE_NAMES.length)]);
                    batchSchedule[item.id] = names.sort(() => Math.random() - 0.5);
                } else {
                    batchSchedule[item.id] = Array(targetCount).fill("N/A");
                }
            } else if (item.type === QuestionType.MULTIPLE_CHOICE_GRID || item.type === QuestionType.CHECKBOX_GRID) {
                batchSchedule[item.id] = [];
            } else if (
                item.type === QuestionType.MULTIPLE_CHOICE ||
                item.type === QuestionType.DROPDOWN ||
                item.type === QuestionType.LINEAR_SCALE
            ) {
                batchSchedule[item.id] = generateBatchForSingleChoice(targetCount, weights[item.id]);
            } else if (item.type === QuestionType.CHECKBOXES) {
                batchSchedule[item.id] = generateBatchForCheckboxes(targetCount, weights[item.id]);
            }
        });

        const performDeduction = async (count: number) => {
            if (user?.role === 'admin') return;
            try {
                const result = await creditsApi.deduct(count);
                addLog('success', `💳 ${count} credits deducted incrementally. Balance: ${result.credits}`);
                refreshCredits();
            } catch (err: any) {
                addLog('error', `Incremental credit deduction failed: ${err.error || 'Unknown error'}`);
            }
        };

        for (let i = 0; i < targetCount; i++) {
            if (stopRequested.current) {
                setLogs(prev => [{ id: i, status: 'stopped', message: "Stopped by user", time: new Date().toLocaleTimeString() }, ...prev]);
                break;
            }
            try {
                if (form.formSource === 'microsoft') {
                    // MICROSOFT FORMS SUBMISSION
                    const msAnswers: any[] = [];

                    form.items.forEach(item => {
                        if (item.type === QuestionType.SECTION_HEADER) return;

                        if (item.type === QuestionType.MULTIPLE_CHOICE_GRID || item.type === QuestionType.CHECKBOX_GRID) {
                            const gridData = generateGridResponse(item);
                            // MS Forms grid format: answers: [{questionId: rowId, answer1: colLabel}]
                            Object.entries(gridData).forEach(([rowId, colLabel]) => {
                                msAnswers.push({
                                    questionId: rowId,
                                    answer1: colLabel
                                });
                            });
                        } else {
                            const scheduledValue = batchSchedule[item.id]?.[i];
                            if (scheduledValue !== undefined && scheduledValue !== "N/A" && item.submissionId) {
                                // Date questions need specific MS Forms valid format (YYYY-MM-DD), but we'll send verbatim for now if any
                                if (Array.isArray(scheduledValue)) {
                                    msAnswers.push({
                                        questionId: item.submissionId,
                                        answer1: JSON.stringify(scheduledValue) // MS forms accepts array of strings as a JSON string for checkboxes
                                    });
                                } else {
                                    msAnswers.push({
                                        questionId: item.submissionId,
                                        answer1: scheduledValue.toString()
                                    });
                                }
                            }
                        }
                    });

                    const submitDate = new Date().toISOString();
                    const msPayload = {
                        startDate: submitDate,
                        submitDate: submitDate,
                        answers: JSON.stringify(msAnswers)
                    };

                    await fetch(form.actionUrl, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(msPayload)
                    });

                }
                await new Promise(resolve => setTimeout(resolve, 500));
                addLog('success', `Submission #${i + 1} finalized successfully`);
                successCount++;
                pendingDeductions++;
                if (pendingDeductions === 5) {
                    await performDeduction(5);
                    pendingDeductions = 0;
                }
            } catch (e) {
                addLog('error', `Submission #${i + 1} failed to reach server`);
            }
            setProgress(i + 1);
            if (i < targetCount - 1 && !stopRequested.current) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        if (pendingDeductions > 0) {
            await performDeduction(pendingDeductions);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsRunning(false);
    };

    const handleResetWeights = () => {
        if (window.confirm("Reset all settings to default?")) {
            setWeights(getInitialWeights(form.items));
            setGridConfigs(getInitialGridConfigs(form.items));
            setSpecialModes({});
        }
    };

    const activeGenderId = Object.entries(specialModes).find(([_, mode]) => mode === 'GENDER')?.[0];
    const activeNameId = Object.entries(specialModes).find(([_, mode]) => mode === 'NAME')?.[0];

    const renderItem = (item: FormItem, idx: number) => {
        if ([QuestionType.MULTIPLE_CHOICE, QuestionType.DROPDOWN, QuestionType.CHECKBOXES, QuestionType.LINEAR_SCALE].includes(item.type)) {
            const canShowGender = !activeGenderId || activeGenderId === item.id;
            return (
                <motion.div key={item.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.04 * idx, ease: [0.22, 1, 0.36, 1] }}>
                    <WeightedQuestionRenderer
                        item={item}
                        weights={weights[item.id]}
                        onWeightChange={(newW) => setWeights(prev => ({ ...prev, [item.id]: newW }))}
                        specialMode={specialModes[item.id] === 'GENDER' ? 'GENDER' : undefined}
                        onToggleSpecialMode={(mode) => setSpecialModes(prev => ({ ...prev, [item.id]: mode }))}
                        showGenderToggle={canShowGender}
                    />
                </motion.div>
            );
        }

        if (item.type === QuestionType.SECTION_HEADER) {
            return (
                <motion.div key={item.id} className="card" style={{ padding: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.04 * idx, ease: [0.22, 1, 0.36, 1] }}>
                    <div style={{ height: '3px', width: '56px', margin: '0 auto 12px', borderRadius: '9999px', background: 'linear-gradient(to right, #4285F4, #5a9cf5)', opacity: 0.5 }}></div>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>{item.title}</h2>
                    {item.description && <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '4px' }}>{item.description}</p>}
                </motion.div>
            );
        }

        if (item.type === QuestionType.MULTIPLE_CHOICE_GRID || item.type === QuestionType.CHECKBOX_GRID) {
            return (
                <motion.div key={item.id} className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.04 * idx, ease: [0.22, 1, 0.36, 1] }}>
                    <h4 style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500, marginBottom: '1rem' }}>{item.title}</h4>
                    <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '12px', border: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', color: '#6b7280' }}>
                            <Shuffle style={{ width: 16, height: 16, marginRight: '8px', color: '#4285F4' }} />
                            Random Selection
                        </div>
                    </div>
                </motion.div>
            );
        }

        if (item.type === QuestionType.SHORT_ANSWER) {
            const isNameMode = specialModes[item.id] === 'NAME';
            const canShowNameToggle = !activeNameId || activeNameId === item.id;
            return (
                <motion.div key={item.id} className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.04 * idx, ease: [0.22, 1, 0.36, 1] }}>
                    <h4 style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500, marginBottom: '1rem' }}>{item.title}</h4>
                    <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '8px', marginBottom: '1rem' }}>
                        <span style={{ color: '#d1d5db', fontSize: '14px' }}>Short answer text</span>
                    </div>
                    <AnimatePresence mode="wait">
                        {canShowNameToggle && (
                            <motion.label
                                key={`name-toggle-${item.id}`}
                                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none', gap: '12px' }}
                                initial={{ opacity: 0, scale: 0.8, filter: 'blur(8px)' }}
                                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
                                exit={{ opacity: 0, scale: 1.3, filter: 'blur(12px)', transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } }}
                            >
                                <button type="button" onClick={() => setSpecialModes(prev => ({ ...prev, [item.id]: isNameMode ? undefined : 'NAME' }))}
                                    className={`toggle-track ${isNameMode ? 'active' : ''}`}>
                                    <div className={`toggle-knob ${isNameMode ? 'active' : ''}`} />
                                </button>
                                <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'color 0.15s', color: isNameMode ? '#4285F4' : '#9ca3af' }}>
                                    {isNameMode ? "Generating Names" : "Generate Names"}
                                </span>
                            </motion.label>
                        )}
                    </AnimatePresence>
                </motion.div>
            );
        }

        return (
            <motion.div key={item.id} className="card" style={{ padding: '1.5rem', marginBottom: '1rem', opacity: 0.6 }}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 0.6, y: 0 }}
                transition={{ duration: 0.4, delay: 0.04 * idx, ease: [0.22, 1, 0.36, 1] }}>
                <h4 style={{ fontSize: '15px', color: '#1f2937', fontWeight: 500, marginBottom: '1rem' }}>{item.title}</h4>
                <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' }}>
                    <span style={{ color: '#d1d5db', fontSize: '14px' }}>
                        {item.type === QuestionType.PARAGRAPH ? "Long answer text" : "Option 1"}
                    </span>
                </div>
            </motion.div>
        );
    };

    const progressPct = targetCount > 0 ? (progress / targetCount) * 100 : 0;

    return (
        <div className="wa-page">
            {/* Frosted Navbar */}
            <motion.div className="wa-navbar"
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <div className="wa-navbar-inner">
                    <button onClick={onBack} style={{ marginRight: '1rem', color: '#9ca3af', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '8px', transition: 'all 0.15s', display: 'flex' }}>
                        <ArrowLeft style={{ width: 20, height: 20 }} />
                    </button>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>Configure weightage and automate submissions</span>
                    <div style={{ marginLeft: 'auto' }}>
                        <button onClick={handleResetWeights} style={{ color: '#d1d5db', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'all 0.15s', display: 'flex' }} title="Reset">
                            <RotateCcw style={{ width: 16, height: 16 }} />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Grid Layout */}
            <div className="wa-grid">
                {/* Questions Column */}
                <div className="space-y-4">
                    {/* Title Card */}
                    <motion.div className="card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', borderRadius: '14px 0 0 14px', background: 'linear-gradient(to bottom, #4285F4, #5a9cf5, #7baaf7)' }}></div>
                        <div style={{ paddingLeft: '1rem' }}>
                            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937', marginBottom: '4px' }}>{form.title}</h1>
                            {form.description && (
                                <div style={{ fontSize: '14px', color: '#9ca3af', borderTop: '1px solid #f9fafb', paddingTop: '12px', marginTop: '8px', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                                    {form.description}
                                </div>
                            )}
                        </div>
                    </motion.div>
                    {form.items.map((item, idx) => renderItem(item, idx))}
                </div>

                {/* Sidebar */}
                <div className="wa-sidebar-sticky">
                    {/* Control Panel */}
                    <motion.div className="card" style={{ overflow: 'hidden' }}
                        initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>
                        <div style={{ padding: '14px 20px', background: 'linear-gradient(to right, #eff6ff, #eef2ff)', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center' }}>
                            <Sliders style={{ width: 16, height: 16, marginRight: '8px', color: '#4285F4' }} />
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Automation Control</span>
                        </div>
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Submissions</label>
                                <input type="number" min="1" max="1000" value={targetCount}
                                    onChange={(e) => setTargetCount(parseInt(e.target.value) || 1)}
                                    disabled={isRunning}
                                    style={{ width: '100%', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px', textAlign: 'center', fontSize: '24px', fontWeight: 700, color: '#1f2937', outline: 'none', boxSizing: 'border-box', transition: 'all 0.15s' }}
                                />
                            </div>
                            {!isRunning ? (
                                <button onClick={handleStart}
                                    className="btn-primary" style={{ width: '100%', fontWeight: 600, padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                                    <Play style={{ width: 16, height: 16, marginRight: '8px' }} fill="currentColor" /> Run Automation
                                </button>
                            ) : (
                                <button onClick={() => stopRequested.current = true}
                                    style={{ width: '100%', background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontWeight: 600, padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', fontSize: '14px', cursor: 'pointer' }}>
                                    <Square style={{ width: 16, height: 16, marginRight: '8px' }} fill="currentColor" /> Stop
                                </button>
                            )}
                        </div>
                        {/* Progress */}
                        <AnimatePresence>
                            {isRunning && (
                                <motion.div style={{ padding: '0 20px 20px' }}
                                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                                        <span style={{ color: '#9ca3af' }}>Progress</span>
                                        <span style={{ color: '#4285F4', fontWeight: 700 }}>{Math.round(progressPct)}%</span>
                                    </div>
                                    <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '9999px', overflow: 'hidden' }}>
                                        <motion.div
                                            className="progress-stripe"
                                            style={{ height: '100%', borderRadius: '9999px', background: 'linear-gradient(to right, #4285F4, #5a9cf5)' }}
                                            animate={{ width: `${progressPct}%` }}
                                            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                                        />
                                    </div>
                                    <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '6px', textAlign: 'center', fontWeight: 500 }}>{progress} / {targetCount} submitted</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Log Card */}
                    <motion.div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '320px' }}
                        initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.45, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}>
                        <div style={{ padding: '12px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(249,250,251,0.5)' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                                <Zap style={{ width: 12, height: 12, marginRight: '6px', color: '#fbbf24' }} />Activity Log
                            </span>
                            <span style={{ fontSize: '10px', background: '#f3f4f6', color: '#9ca3af', padding: '2px 8px', borderRadius: '9999px', fontFamily: 'monospace', fontWeight: 700 }}>{logs.length}</span>
                        </div>
                        <div className="custom-scrollbar" style={{ overflowY: 'auto', flex: 1 }}>
                            {logs.length === 0 ? (
                                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#d1d5db', fontSize: '12px', fontStyle: 'italic', fontWeight: 500 }}>Ready to start...</div>
                            ) : (
                                <div>
                                    {logs.map((log, i) => (
                                        <motion.div key={log.id}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                            style={{
                                                padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px',
                                                transition: 'background 0.15s', borderBottom: '1px solid #fafafa',
                                                background: i === 0 ? 'rgba(219,234,254,0.3)' : 'transparent',
                                            }}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                {log.status === 'success' && i === 0 ? (
                                                    <span className="animate-check-pop" style={{ width: 16, height: 16, borderRadius: '50%', background: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px' }}>
                                                        <Check style={{ width: 10, height: 10, color: 'white' }} />
                                                    </span>
                                                ) : (
                                                    <span className={i === 0 ? 'dot-new' : ''} style={{
                                                        width: 8, height: 8, borderRadius: '50%', marginRight: '10px',
                                                        background: log.status === 'success' ? '#34d399' : log.status === 'error' ? '#f87171' : '#fbbf24',
                                                    }}></span>
                                                )}
                                                <span style={{ color: '#4b5563', fontWeight: 500 }}>#{log.id}</span>
                                                <span style={{ marginLeft: '8px', color: log.status === 'success' ? '#10b981' : log.status === 'error' ? '#ef4444' : '#f59e0b' }}>{log.message}</span>
                                            </div>
                                            <span style={{ color: '#d1d5db', fontFamily: 'monospace', fontSize: '10px' }}>{log.time}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
