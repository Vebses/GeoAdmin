/**
 * Complete ISO 3166-1 alpha-2 country list with:
 *   - ISO code (2 letters, used for storage + flag URL)
 *   - English name
 *   - Georgian name (for frequent countries; falls back to English)
 *   - Primary dial code
 *
 * Flag icons are sourced from circle-flags via jsdelivr CDN:
 *   https://cdn.jsdelivr.net/gh/HatScripts/circle-flags/flags/{code}.svg
 *
 * Legacy records that stored the full country NAME instead of the code
 * are still supported — see findCountryByValue() at the bottom.
 */

export interface Country {
  /** ISO 3166-1 alpha-2 code, lowercase (matches flag URL) */
  code: string;
  /** English display name */
  name: string;
  /** Georgian display name (falls back to English where no common translation) */
  nameKa: string;
  /** Primary E.164 dial code, without `+` */
  dialCode: string;
}

/**
 * Full country list. Codes are lowercase for direct URL use.
 * Georgian names are provided for commonly-used countries.
 */
export const COUNTRIES: Country[] = [
  { code: 'af', name: 'Afghanistan', nameKa: 'ავღანეთი', dialCode: '93' },
  { code: 'ax', name: 'Åland Islands', nameKa: 'Åland Islands', dialCode: '358' },
  { code: 'al', name: 'Albania', nameKa: 'ალბანეთი', dialCode: '355' },
  { code: 'dz', name: 'Algeria', nameKa: 'ალჟირი', dialCode: '213' },
  { code: 'as', name: 'American Samoa', nameKa: 'American Samoa', dialCode: '1684' },
  { code: 'ad', name: 'Andorra', nameKa: 'ანდორა', dialCode: '376' },
  { code: 'ao', name: 'Angola', nameKa: 'ანგოლა', dialCode: '244' },
  { code: 'ai', name: 'Anguilla', nameKa: 'Anguilla', dialCode: '1264' },
  { code: 'aq', name: 'Antarctica', nameKa: 'Antarctica', dialCode: '672' },
  { code: 'ag', name: 'Antigua and Barbuda', nameKa: 'Antigua and Barbuda', dialCode: '1268' },
  { code: 'ar', name: 'Argentina', nameKa: 'არგენტინა', dialCode: '54' },
  { code: 'am', name: 'Armenia', nameKa: 'სომხეთი', dialCode: '374' },
  { code: 'aw', name: 'Aruba', nameKa: 'Aruba', dialCode: '297' },
  { code: 'au', name: 'Australia', nameKa: 'ავსტრალია', dialCode: '61' },
  { code: 'at', name: 'Austria', nameKa: 'ავსტრია', dialCode: '43' },
  { code: 'az', name: 'Azerbaijan', nameKa: 'აზერბაიჯანი', dialCode: '994' },
  { code: 'bs', name: 'Bahamas', nameKa: 'Bahamas', dialCode: '1242' },
  { code: 'bh', name: 'Bahrain', nameKa: 'ბაჰრეინი', dialCode: '973' },
  { code: 'bd', name: 'Bangladesh', nameKa: 'ბანგლადეში', dialCode: '880' },
  { code: 'bb', name: 'Barbados', nameKa: 'Barbados', dialCode: '1246' },
  { code: 'by', name: 'Belarus', nameKa: 'ბელარუსი', dialCode: '375' },
  { code: 'be', name: 'Belgium', nameKa: 'ბელგია', dialCode: '32' },
  { code: 'bz', name: 'Belize', nameKa: 'Belize', dialCode: '501' },
  { code: 'bj', name: 'Benin', nameKa: 'Benin', dialCode: '229' },
  { code: 'bm', name: 'Bermuda', nameKa: 'Bermuda', dialCode: '1441' },
  { code: 'bt', name: 'Bhutan', nameKa: 'Bhutan', dialCode: '975' },
  { code: 'bo', name: 'Bolivia', nameKa: 'ბოლივია', dialCode: '591' },
  { code: 'ba', name: 'Bosnia and Herzegovina', nameKa: 'ბოსნია და ჰერცეგოვინა', dialCode: '387' },
  { code: 'bw', name: 'Botswana', nameKa: 'Botswana', dialCode: '267' },
  { code: 'br', name: 'Brazil', nameKa: 'ბრაზილია', dialCode: '55' },
  { code: 'io', name: 'British Indian Ocean Territory', nameKa: 'British Indian Ocean Territory', dialCode: '246' },
  { code: 'vg', name: 'British Virgin Islands', nameKa: 'British Virgin Islands', dialCode: '1284' },
  { code: 'bn', name: 'Brunei', nameKa: 'Brunei', dialCode: '673' },
  { code: 'bg', name: 'Bulgaria', nameKa: 'ბულგარეთი', dialCode: '359' },
  { code: 'bf', name: 'Burkina Faso', nameKa: 'Burkina Faso', dialCode: '226' },
  { code: 'bi', name: 'Burundi', nameKa: 'Burundi', dialCode: '257' },
  { code: 'kh', name: 'Cambodia', nameKa: 'კამბოჯა', dialCode: '855' },
  { code: 'cm', name: 'Cameroon', nameKa: 'Cameroon', dialCode: '237' },
  { code: 'ca', name: 'Canada', nameKa: 'კანადა', dialCode: '1' },
  { code: 'cv', name: 'Cape Verde', nameKa: 'Cape Verde', dialCode: '238' },
  { code: 'bq', name: 'Caribbean Netherlands', nameKa: 'Caribbean Netherlands', dialCode: '599' },
  { code: 'ky', name: 'Cayman Islands', nameKa: 'Cayman Islands', dialCode: '1345' },
  { code: 'cf', name: 'Central African Republic', nameKa: 'Central African Republic', dialCode: '236' },
  { code: 'td', name: 'Chad', nameKa: 'Chad', dialCode: '235' },
  { code: 'cl', name: 'Chile', nameKa: 'ჩილე', dialCode: '56' },
  { code: 'cn', name: 'China', nameKa: 'ჩინეთი', dialCode: '86' },
  { code: 'cx', name: 'Christmas Island', nameKa: 'Christmas Island', dialCode: '61' },
  { code: 'cc', name: 'Cocos (Keeling) Islands', nameKa: 'Cocos (Keeling) Islands', dialCode: '61' },
  { code: 'co', name: 'Colombia', nameKa: 'კოლუმბია', dialCode: '57' },
  { code: 'km', name: 'Comoros', nameKa: 'Comoros', dialCode: '269' },
  { code: 'cg', name: 'Congo', nameKa: 'Congo', dialCode: '242' },
  { code: 'cd', name: 'Congo (DRC)', nameKa: 'Congo (DRC)', dialCode: '243' },
  { code: 'ck', name: 'Cook Islands', nameKa: 'Cook Islands', dialCode: '682' },
  { code: 'cr', name: 'Costa Rica', nameKa: 'კოსტა-რიკა', dialCode: '506' },
  { code: 'ci', name: "Côte d'Ivoire", nameKa: "Côte d'Ivoire", dialCode: '225' },
  { code: 'hr', name: 'Croatia', nameKa: 'ხორვატია', dialCode: '385' },
  { code: 'cu', name: 'Cuba', nameKa: 'კუბა', dialCode: '53' },
  { code: 'cw', name: 'Curaçao', nameKa: 'Curaçao', dialCode: '599' },
  { code: 'cy', name: 'Cyprus', nameKa: 'კვიპროსი', dialCode: '357' },
  { code: 'cz', name: 'Czech Republic', nameKa: 'ჩეხეთი', dialCode: '420' },
  { code: 'dk', name: 'Denmark', nameKa: 'დანია', dialCode: '45' },
  { code: 'dj', name: 'Djibouti', nameKa: 'Djibouti', dialCode: '253' },
  { code: 'dm', name: 'Dominica', nameKa: 'Dominica', dialCode: '1767' },
  { code: 'do', name: 'Dominican Republic', nameKa: 'დომინიკის რესპუბლიკა', dialCode: '1' },
  { code: 'ec', name: 'Ecuador', nameKa: 'ეკვადორი', dialCode: '593' },
  { code: 'eg', name: 'Egypt', nameKa: 'ეგვიპტე', dialCode: '20' },
  { code: 'sv', name: 'El Salvador', nameKa: 'El Salvador', dialCode: '503' },
  { code: 'gq', name: 'Equatorial Guinea', nameKa: 'Equatorial Guinea', dialCode: '240' },
  { code: 'er', name: 'Eritrea', nameKa: 'Eritrea', dialCode: '291' },
  { code: 'ee', name: 'Estonia', nameKa: 'ესტონეთი', dialCode: '372' },
  { code: 'sz', name: 'Eswatini', nameKa: 'Eswatini', dialCode: '268' },
  { code: 'et', name: 'Ethiopia', nameKa: 'ეთიოპია', dialCode: '251' },
  { code: 'fk', name: 'Falkland Islands', nameKa: 'Falkland Islands', dialCode: '500' },
  { code: 'fo', name: 'Faroe Islands', nameKa: 'Faroe Islands', dialCode: '298' },
  { code: 'fj', name: 'Fiji', nameKa: 'Fiji', dialCode: '679' },
  { code: 'fi', name: 'Finland', nameKa: 'ფინეთი', dialCode: '358' },
  { code: 'fr', name: 'France', nameKa: 'საფრანგეთი', dialCode: '33' },
  { code: 'gf', name: 'French Guiana', nameKa: 'French Guiana', dialCode: '594' },
  { code: 'pf', name: 'French Polynesia', nameKa: 'French Polynesia', dialCode: '689' },
  { code: 'ga', name: 'Gabon', nameKa: 'Gabon', dialCode: '241' },
  { code: 'gm', name: 'Gambia', nameKa: 'Gambia', dialCode: '220' },
  { code: 'ge', name: 'Georgia', nameKa: 'საქართველო', dialCode: '995' },
  { code: 'de', name: 'Germany', nameKa: 'გერმანია', dialCode: '49' },
  { code: 'gh', name: 'Ghana', nameKa: 'განა', dialCode: '233' },
  { code: 'gi', name: 'Gibraltar', nameKa: 'Gibraltar', dialCode: '350' },
  { code: 'gr', name: 'Greece', nameKa: 'საბერძნეთი', dialCode: '30' },
  { code: 'gl', name: 'Greenland', nameKa: 'Greenland', dialCode: '299' },
  { code: 'gd', name: 'Grenada', nameKa: 'Grenada', dialCode: '1473' },
  { code: 'gp', name: 'Guadeloupe', nameKa: 'Guadeloupe', dialCode: '590' },
  { code: 'gu', name: 'Guam', nameKa: 'Guam', dialCode: '1671' },
  { code: 'gt', name: 'Guatemala', nameKa: 'Guatemala', dialCode: '502' },
  { code: 'gg', name: 'Guernsey', nameKa: 'Guernsey', dialCode: '44' },
  { code: 'gn', name: 'Guinea', nameKa: 'Guinea', dialCode: '224' },
  { code: 'gw', name: 'Guinea-Bissau', nameKa: 'Guinea-Bissau', dialCode: '245' },
  { code: 'gy', name: 'Guyana', nameKa: 'Guyana', dialCode: '592' },
  { code: 'ht', name: 'Haiti', nameKa: 'Haiti', dialCode: '509' },
  { code: 'hn', name: 'Honduras', nameKa: 'Honduras', dialCode: '504' },
  { code: 'hk', name: 'Hong Kong', nameKa: 'ჰონგ-კონგი', dialCode: '852' },
  { code: 'hu', name: 'Hungary', nameKa: 'უნგრეთი', dialCode: '36' },
  { code: 'is', name: 'Iceland', nameKa: 'ისლანდია', dialCode: '354' },
  { code: 'in', name: 'India', nameKa: 'ინდოეთი', dialCode: '91' },
  { code: 'id', name: 'Indonesia', nameKa: 'ინდონეზია', dialCode: '62' },
  { code: 'ir', name: 'Iran', nameKa: 'ირანი', dialCode: '98' },
  { code: 'iq', name: 'Iraq', nameKa: 'ერაყი', dialCode: '964' },
  { code: 'ie', name: 'Ireland', nameKa: 'ირლანდია', dialCode: '353' },
  { code: 'im', name: 'Isle of Man', nameKa: 'Isle of Man', dialCode: '44' },
  { code: 'il', name: 'Israel', nameKa: 'ისრაელი', dialCode: '972' },
  { code: 'it', name: 'Italy', nameKa: 'იტალია', dialCode: '39' },
  { code: 'jm', name: 'Jamaica', nameKa: 'Jamaica', dialCode: '1876' },
  { code: 'jp', name: 'Japan', nameKa: 'იაპონია', dialCode: '81' },
  { code: 'je', name: 'Jersey', nameKa: 'Jersey', dialCode: '44' },
  { code: 'jo', name: 'Jordan', nameKa: 'იორდანია', dialCode: '962' },
  { code: 'kz', name: 'Kazakhstan', nameKa: 'ყაზახეთი', dialCode: '7' },
  { code: 'ke', name: 'Kenya', nameKa: 'კენია', dialCode: '254' },
  { code: 'ki', name: 'Kiribati', nameKa: 'Kiribati', dialCode: '686' },
  { code: 'xk', name: 'Kosovo', nameKa: 'კოსოვო', dialCode: '383' },
  { code: 'kw', name: 'Kuwait', nameKa: 'ქუვეითი', dialCode: '965' },
  { code: 'kg', name: 'Kyrgyzstan', nameKa: 'ყირგიზეთი', dialCode: '996' },
  { code: 'la', name: 'Laos', nameKa: 'Laos', dialCode: '856' },
  { code: 'lv', name: 'Latvia', nameKa: 'ლატვია', dialCode: '371' },
  { code: 'lb', name: 'Lebanon', nameKa: 'ლიბანი', dialCode: '961' },
  { code: 'ls', name: 'Lesotho', nameKa: 'Lesotho', dialCode: '266' },
  { code: 'lr', name: 'Liberia', nameKa: 'Liberia', dialCode: '231' },
  { code: 'ly', name: 'Libya', nameKa: 'ლიბია', dialCode: '218' },
  { code: 'li', name: 'Liechtenstein', nameKa: 'Liechtenstein', dialCode: '423' },
  { code: 'lt', name: 'Lithuania', nameKa: 'ლიტვა', dialCode: '370' },
  { code: 'lu', name: 'Luxembourg', nameKa: 'ლუქსემბურგი', dialCode: '352' },
  { code: 'mo', name: 'Macau', nameKa: 'Macau', dialCode: '853' },
  { code: 'mg', name: 'Madagascar', nameKa: 'Madagascar', dialCode: '261' },
  { code: 'mw', name: 'Malawi', nameKa: 'Malawi', dialCode: '265' },
  { code: 'my', name: 'Malaysia', nameKa: 'მალაიზია', dialCode: '60' },
  { code: 'mv', name: 'Maldives', nameKa: 'Maldives', dialCode: '960' },
  { code: 'ml', name: 'Mali', nameKa: 'Mali', dialCode: '223' },
  { code: 'mt', name: 'Malta', nameKa: 'მალტა', dialCode: '356' },
  { code: 'mh', name: 'Marshall Islands', nameKa: 'Marshall Islands', dialCode: '692' },
  { code: 'mq', name: 'Martinique', nameKa: 'Martinique', dialCode: '596' },
  { code: 'mr', name: 'Mauritania', nameKa: 'Mauritania', dialCode: '222' },
  { code: 'mu', name: 'Mauritius', nameKa: 'Mauritius', dialCode: '230' },
  { code: 'yt', name: 'Mayotte', nameKa: 'Mayotte', dialCode: '262' },
  { code: 'mx', name: 'Mexico', nameKa: 'მექსიკა', dialCode: '52' },
  { code: 'fm', name: 'Micronesia', nameKa: 'Micronesia', dialCode: '691' },
  { code: 'md', name: 'Moldova', nameKa: 'მოლდოვა', dialCode: '373' },
  { code: 'mc', name: 'Monaco', nameKa: 'მონაკო', dialCode: '377' },
  { code: 'mn', name: 'Mongolia', nameKa: 'მონღოლეთი', dialCode: '976' },
  { code: 'me', name: 'Montenegro', nameKa: 'მონტენეგრო', dialCode: '382' },
  { code: 'ms', name: 'Montserrat', nameKa: 'Montserrat', dialCode: '1664' },
  { code: 'ma', name: 'Morocco', nameKa: 'მაროკო', dialCode: '212' },
  { code: 'mz', name: 'Mozambique', nameKa: 'Mozambique', dialCode: '258' },
  { code: 'mm', name: 'Myanmar', nameKa: 'Myanmar', dialCode: '95' },
  { code: 'na', name: 'Namibia', nameKa: 'Namibia', dialCode: '264' },
  { code: 'nr', name: 'Nauru', nameKa: 'Nauru', dialCode: '674' },
  { code: 'np', name: 'Nepal', nameKa: 'Nepal', dialCode: '977' },
  { code: 'nl', name: 'Netherlands', nameKa: 'ნიდერლანდები', dialCode: '31' },
  { code: 'nc', name: 'New Caledonia', nameKa: 'New Caledonia', dialCode: '687' },
  { code: 'nz', name: 'New Zealand', nameKa: 'ახალი ზელანდია', dialCode: '64' },
  { code: 'ni', name: 'Nicaragua', nameKa: 'Nicaragua', dialCode: '505' },
  { code: 'ne', name: 'Niger', nameKa: 'Niger', dialCode: '227' },
  { code: 'ng', name: 'Nigeria', nameKa: 'ნიგერია', dialCode: '234' },
  { code: 'nu', name: 'Niue', nameKa: 'Niue', dialCode: '683' },
  { code: 'nf', name: 'Norfolk Island', nameKa: 'Norfolk Island', dialCode: '672' },
  { code: 'kp', name: 'North Korea', nameKa: 'ჩრდილოეთ კორეა', dialCode: '850' },
  { code: 'mk', name: 'North Macedonia', nameKa: 'ჩრდილოეთ მაკედონია', dialCode: '389' },
  { code: 'mp', name: 'Northern Mariana Islands', nameKa: 'Northern Mariana Islands', dialCode: '1670' },
  { code: 'no', name: 'Norway', nameKa: 'ნორვეგია', dialCode: '47' },
  { code: 'om', name: 'Oman', nameKa: 'ომანი', dialCode: '968' },
  { code: 'pk', name: 'Pakistan', nameKa: 'პაკისტანი', dialCode: '92' },
  { code: 'pw', name: 'Palau', nameKa: 'Palau', dialCode: '680' },
  { code: 'ps', name: 'Palestine', nameKa: 'პალესტინა', dialCode: '970' },
  { code: 'pa', name: 'Panama', nameKa: 'Panama', dialCode: '507' },
  { code: 'pg', name: 'Papua New Guinea', nameKa: 'Papua New Guinea', dialCode: '675' },
  { code: 'py', name: 'Paraguay', nameKa: 'Paraguay', dialCode: '595' },
  { code: 'pe', name: 'Peru', nameKa: 'პერუ', dialCode: '51' },
  { code: 'ph', name: 'Philippines', nameKa: 'ფილიპინები', dialCode: '63' },
  { code: 'pn', name: 'Pitcairn Islands', nameKa: 'Pitcairn Islands', dialCode: '64' },
  { code: 'pl', name: 'Poland', nameKa: 'პოლონეთი', dialCode: '48' },
  { code: 'pt', name: 'Portugal', nameKa: 'პორტუგალია', dialCode: '351' },
  { code: 'pr', name: 'Puerto Rico', nameKa: 'Puerto Rico', dialCode: '1' },
  { code: 'qa', name: 'Qatar', nameKa: 'კატარი', dialCode: '974' },
  { code: 're', name: 'Réunion', nameKa: 'Réunion', dialCode: '262' },
  { code: 'ro', name: 'Romania', nameKa: 'რუმინეთი', dialCode: '40' },
  { code: 'ru', name: 'Russia', nameKa: 'რუსეთი', dialCode: '7' },
  { code: 'rw', name: 'Rwanda', nameKa: 'Rwanda', dialCode: '250' },
  { code: 'bl', name: 'Saint Barthélemy', nameKa: 'Saint Barthélemy', dialCode: '590' },
  { code: 'sh', name: 'Saint Helena', nameKa: 'Saint Helena', dialCode: '290' },
  { code: 'kn', name: 'Saint Kitts and Nevis', nameKa: 'Saint Kitts and Nevis', dialCode: '1869' },
  { code: 'lc', name: 'Saint Lucia', nameKa: 'Saint Lucia', dialCode: '1758' },
  { code: 'mf', name: 'Saint Martin', nameKa: 'Saint Martin', dialCode: '590' },
  { code: 'pm', name: 'Saint Pierre and Miquelon', nameKa: 'Saint Pierre and Miquelon', dialCode: '508' },
  { code: 'vc', name: 'Saint Vincent and the Grenadines', nameKa: 'Saint Vincent and the Grenadines', dialCode: '1784' },
  { code: 'ws', name: 'Samoa', nameKa: 'Samoa', dialCode: '685' },
  { code: 'sm', name: 'San Marino', nameKa: 'San Marino', dialCode: '378' },
  { code: 'st', name: 'São Tomé and Príncipe', nameKa: 'São Tomé and Príncipe', dialCode: '239' },
  { code: 'sa', name: 'Saudi Arabia', nameKa: 'საუდის არაბეთი', dialCode: '966' },
  { code: 'sn', name: 'Senegal', nameKa: 'Senegal', dialCode: '221' },
  { code: 'rs', name: 'Serbia', nameKa: 'სერბეთი', dialCode: '381' },
  { code: 'sc', name: 'Seychelles', nameKa: 'Seychelles', dialCode: '248' },
  { code: 'sl', name: 'Sierra Leone', nameKa: 'Sierra Leone', dialCode: '232' },
  { code: 'sg', name: 'Singapore', nameKa: 'სინგაპური', dialCode: '65' },
  { code: 'sx', name: 'Sint Maarten', nameKa: 'Sint Maarten', dialCode: '1721' },
  { code: 'sk', name: 'Slovakia', nameKa: 'სლოვაკეთი', dialCode: '421' },
  { code: 'si', name: 'Slovenia', nameKa: 'სლოვენია', dialCode: '386' },
  { code: 'sb', name: 'Solomon Islands', nameKa: 'Solomon Islands', dialCode: '677' },
  { code: 'so', name: 'Somalia', nameKa: 'Somalia', dialCode: '252' },
  { code: 'za', name: 'South Africa', nameKa: 'სამხრეთ აფრიკა', dialCode: '27' },
  { code: 'gs', name: 'South Georgia', nameKa: 'South Georgia', dialCode: '500' },
  { code: 'kr', name: 'South Korea', nameKa: 'სამხრეთ კორეა', dialCode: '82' },
  { code: 'ss', name: 'South Sudan', nameKa: 'South Sudan', dialCode: '211' },
  { code: 'es', name: 'Spain', nameKa: 'ესპანეთი', dialCode: '34' },
  { code: 'lk', name: 'Sri Lanka', nameKa: 'Sri Lanka', dialCode: '94' },
  { code: 'sd', name: 'Sudan', nameKa: 'Sudan', dialCode: '249' },
  { code: 'sr', name: 'Suriname', nameKa: 'Suriname', dialCode: '597' },
  { code: 'sj', name: 'Svalbard and Jan Mayen', nameKa: 'Svalbard and Jan Mayen', dialCode: '47' },
  { code: 'se', name: 'Sweden', nameKa: 'შვედეთი', dialCode: '46' },
  { code: 'ch', name: 'Switzerland', nameKa: 'შვეიცარია', dialCode: '41' },
  { code: 'sy', name: 'Syria', nameKa: 'სირია', dialCode: '963' },
  { code: 'tw', name: 'Taiwan', nameKa: 'ტაივანი', dialCode: '886' },
  { code: 'tj', name: 'Tajikistan', nameKa: 'ტაჯიკეთი', dialCode: '992' },
  { code: 'tz', name: 'Tanzania', nameKa: 'Tanzania', dialCode: '255' },
  { code: 'th', name: 'Thailand', nameKa: 'ტაილანდი', dialCode: '66' },
  { code: 'tl', name: 'Timor-Leste', nameKa: 'Timor-Leste', dialCode: '670' },
  { code: 'tg', name: 'Togo', nameKa: 'Togo', dialCode: '228' },
  { code: 'tk', name: 'Tokelau', nameKa: 'Tokelau', dialCode: '690' },
  { code: 'to', name: 'Tonga', nameKa: 'Tonga', dialCode: '676' },
  { code: 'tt', name: 'Trinidad and Tobago', nameKa: 'Trinidad and Tobago', dialCode: '1868' },
  { code: 'tn', name: 'Tunisia', nameKa: 'ტუნისი', dialCode: '216' },
  { code: 'tr', name: 'Turkey', nameKa: 'თურქეთი', dialCode: '90' },
  { code: 'tm', name: 'Turkmenistan', nameKa: 'თურქმენეთი', dialCode: '993' },
  { code: 'tc', name: 'Turks and Caicos Islands', nameKa: 'Turks and Caicos Islands', dialCode: '1649' },
  { code: 'tv', name: 'Tuvalu', nameKa: 'Tuvalu', dialCode: '688' },
  { code: 'ug', name: 'Uganda', nameKa: 'Uganda', dialCode: '256' },
  { code: 'ua', name: 'Ukraine', nameKa: 'უკრაინა', dialCode: '380' },
  { code: 'ae', name: 'United Arab Emirates', nameKa: 'არაბთა გაერთიანებული საამიროები', dialCode: '971' },
  { code: 'gb', name: 'United Kingdom', nameKa: 'გაერთიანებული სამეფო', dialCode: '44' },
  { code: 'us', name: 'United States', nameKa: 'აშშ', dialCode: '1' },
  { code: 'uy', name: 'Uruguay', nameKa: 'Uruguay', dialCode: '598' },
  { code: 'uz', name: 'Uzbekistan', nameKa: 'უზბეკეთი', dialCode: '998' },
  { code: 'vu', name: 'Vanuatu', nameKa: 'Vanuatu', dialCode: '678' },
  { code: 'va', name: 'Vatican City', nameKa: 'ვატიკანი', dialCode: '39' },
  { code: 've', name: 'Venezuela', nameKa: 'ვენესუელა', dialCode: '58' },
  { code: 'vn', name: 'Vietnam', nameKa: 'ვიეტნამი', dialCode: '84' },
  { code: 'wf', name: 'Wallis and Futuna', nameKa: 'Wallis and Futuna', dialCode: '681' },
  { code: 'eh', name: 'Western Sahara', nameKa: 'Western Sahara', dialCode: '212' },
  { code: 'ye', name: 'Yemen', nameKa: 'Yemen', dialCode: '967' },
  { code: 'zm', name: 'Zambia', nameKa: 'Zambia', dialCode: '260' },
  { code: 'zw', name: 'Zimbabwe', nameKa: 'Zimbabwe', dialCode: '263' },
];

/**
 * CDN for circle-flags SVGs.
 * jsdelivr is production-grade + caches globally, unlike raw github pages.
 */
export const FLAG_CDN_BASE = 'https://cdn.jsdelivr.net/gh/HatScripts/circle-flags/flags';

/** Build the flag SVG URL for a given country code (case-insensitive) */
export function flagUrl(code: string | null | undefined): string {
  if (!code) return '';
  return `${FLAG_CDN_BASE}/${code.toLowerCase()}.svg`;
}

/** Quick-lookup map by ISO code */
const COUNTRY_BY_CODE: Record<string, Country> = (() => {
  const map: Record<string, Country> = {};
  for (const c of COUNTRIES) map[c.code] = c;
  return map;
})();

export function getCountryByCode(code: string | null | undefined): Country | null {
  if (!code) return null;
  return COUNTRY_BY_CODE[code.toLowerCase()] || null;
}

/**
 * Gracefully resolve a stored country value to a Country record.
 * Supports:
 *   - ISO codes ("ge", "GE")
 *   - English names ("Georgia")
 *   - Georgian names ("საქართველო")
 *
 * Returns null if no match — caller should display the raw value as-is.
 */
export function findCountryByValue(value: string | null | undefined): Country | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;

  // ISO code fast path
  const byCode = getCountryByCode(trimmed);
  if (byCode) return byCode;

  // Name match (case-insensitive, English + Georgian)
  const lower = trimmed.toLowerCase();
  for (const c of COUNTRIES) {
    if (c.name.toLowerCase() === lower) return c;
    if (c.nameKa === trimmed) return c;
  }
  return null;
}

/**
 * Produce a display label for a country value. If the value is a known code
 * or name, returns the localized name. Otherwise returns the raw value.
 */
export function countryDisplayName(
  value: string | null | undefined,
  locale: 'ka' | 'en' = 'ka'
): string {
  if (!value) return '';
  const match = findCountryByValue(value);
  if (match) return locale === 'ka' ? match.nameKa : match.name;
  return value;
}

/**
 * Search countries by name (English or Georgian) or dial code or ISO code.
 * Returns up to `limit` matches, ranked by exact-then-prefix-then-substring.
 */
export function searchCountries(query: string, limit = 50): Country[] {
  const q = query.trim().toLowerCase();
  if (!q) return COUNTRIES.slice(0, limit);

  const starts: Country[] = [];
  const contains: Country[] = [];

  for (const c of COUNTRIES) {
    const n = c.name.toLowerCase();
    const ka = c.nameKa.toLowerCase();
    const code = c.code.toLowerCase();
    const dc = c.dialCode;

    if (n === q || ka === q || code === q || dc === q) {
      starts.unshift(c); // exact match first
    } else if (n.startsWith(q) || ka.startsWith(q) || code.startsWith(q) || dc.startsWith(q)) {
      starts.push(c);
    } else if (n.includes(q) || ka.includes(q) || dc.includes(q)) {
      contains.push(c);
    }
  }

  return [...starts, ...contains].slice(0, limit);
}
