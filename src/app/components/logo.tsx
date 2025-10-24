import Link from 'next/link';
import Image from 'next/image';
import logo from '../../../public/logocrash.png';

export default function Logo() {
    return (
        <Link href="/" className="flex items-center space-x-2">
            <Image src={logo} alt="Crashify Logo" width={120} height={60} />
        </Link>
    );
}
